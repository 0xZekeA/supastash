import { DEFAULT_CHUNK_SIZE } from "../../../constants/syncDefaults";
import { getSupastashConfig } from "../../../core/config";
import { isOnline } from "../../../utils/connection";
import { normalizeForSupabase } from "../../getSafeValues";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { setQueryStatus, SyncInfoUpdater } from "../queryStatus";
import { enforceTimestamps } from "./normalize";
import { backoff, batchUpsert, fetchRemoteHeadsChunked, filterRowsByUpdatedAt, handleRowFailure, markSynced, rpcUpsert, rpcUpsertSingle, singleUpsert, } from "./uploadHelpers";
/**
 * Uploads a chunk of data to the remote database
 *
 * It will check if the data in the remote database is more recent than the data in the local database.
 * If it is, it will skip it.
 * If it is not, it will upsert it.
 *
 * @param table - The table to upload to
 * @param chunk - The chunk of data to upload
 */
async function uploadChunk(table, chunk, onPushToRemote) {
    const config = getSupastashConfig();
    const supabase = config.supabaseClient;
    if (!supabase) {
        throw new Error(supabaseClientErr);
    }
    const online = await isOnline();
    if (!online)
        return;
    let errorCount = 0;
    let lastError = null;
    let pending = [];
    const hasRPCPath = !!config.pushRPCPath;
    const ids = chunk.map((row) => row.id);
    const toPush = [];
    // If we have a RPC path, we can push the whole chunk. Server validates freshness.
    if (hasRPCPath) {
        toPush.push(...chunk);
    }
    else {
        // Fetch remote data for the current chunk
        const remoteIds = await fetchRemoteHeadsChunked(table, ids, supabase);
        // Loop through the initial chunk and check if the id is in the remote data
        const filtered = filterRowsByUpdatedAt(table, chunk, remoteIds);
        toPush.push(...filtered);
    }
    if (toPush.length === 0)
        return;
    const preflightOK = [];
    if (config.syncPolicy?.ensureParents) {
        for (const r of toPush) {
            try {
                const status = await config.syncPolicy.ensureParents(table, r);
                if (status === "blocked") {
                    setQueryStatus(r.id, table, "error");
                    continue;
                }
                preflightOK.push(r);
            }
            catch (e) {
                setQueryStatus(r.id, table, "error");
                log(`[Supastash] ensureParents failed for ${table}:${r.id}`, e);
            }
        }
    }
    else {
        preflightOK.push(...toPush);
    }
    if (preflightOK.length === 0)
        return;
    pending.push(...preflightOK);
    const maxBatchAttempts = config.syncPolicy?.maxBatchAttempts ?? 5;
    let attempts = 0;
    while (attempts < maxBatchAttempts && pending.length > 0) {
        let batchOk = false;
        // RPC return values
        let completed = [];
        let existsMap = new Map();
        if (onPushToRemote) {
            const ok = await onPushToRemote(pending);
            if (ok)
                batchOk = true;
        }
        else if (hasRPCPath) {
            const res = await rpcUpsert({ table, rows: pending, supabase });
            completed = res.data.completed;
            pending = [...res.data.skipped];
            existsMap = res.data.existsMap;
            batchOk = res.error == null && pending.length === 0;
            // If there was an RPC error, we need to retry the main function
            if (res.error) {
                attempts++;
                await backoff(attempts);
                pending = [...preflightOK];
                continue;
            }
        }
        else {
            const { error } = await batchUpsert(table, pending, supabase);
            if (!error)
                batchOk = true;
        }
        if (batchOk) {
            await markSynced(table, pending.map((r) => r.id));
            return;
        }
        if (completed.length > 0) {
            await markSynced(table, completed.map((r) => r.id));
        }
        //Batch failed -> isolate per-row offenders
        const keep = [];
        const syncedNow = [];
        for (const row of pending) {
            let res = null;
            if (onPushToRemote) {
                const ok = await onPushToRemote([row]);
                res = { error: ok ? null : { code: "ROW_FAILED" } };
            }
            else if (hasRPCPath) {
                res = await rpcUpsertSingle({ table, row, supabase, existsMap });
            }
            else {
                res = await singleUpsert(table, row, supabase);
            }
            if (!res.error) {
                syncedNow.push(row.id);
                continue;
            }
            errorCount++;
            lastError = res.error;
            const decision = await handleRowFailure(config, table, row, res.error, supabase);
            if (decision === "DROP" || decision === "REPLACED") {
                continue;
            }
            keep.push(row); // retry later
        }
        if (syncedNow.length)
            await markSynced(table, syncedNow);
        if (keep.length === 0)
            return;
        // Backoff before next batch round (exponential, bounded by policy)
        attempts++;
        await backoff(attempts);
        pending = keep;
    }
    if (pending.length > 0) {
        SyncInfoUpdater.markLogError({
            type: "push",
            table,
            lastError: lastError ?? new Error("Unknown error"),
            errorCount: errorCount ?? 0,
            rowsFailed: pending.length,
        });
    }
    // Gave up this pass — rows left in `pending` will be retried by outer scheduler
    for (const r of pending)
        setQueryStatus(r.id, table, "error");
}
/**
 * Uploads a chunk of data to the remote database
 * @param table - The table to upload to
 * @param unsyncedRecords - The unsynced records to upload
 */
export async function uploadData(table, unsyncedRecords, onPushToRemote) {
    const cfg = getSupastashConfig();
    const supabase = cfg.supabaseClient;
    if (!supabase)
        throw new Error("[Supastash] Supabase client not configured");
    const cleaned = unsyncedRecords.map(({ synced_at, deleted_at, ...rest }) => enforceTimestamps(normalizeForSupabase(rest)));
    for (let i = 0; i < cleaned.length; i += DEFAULT_CHUNK_SIZE) {
        const chunk = cleaned.slice(i, i + DEFAULT_CHUNK_SIZE);
        await uploadChunk(table, chunk, onPushToRemote);
    }
}
