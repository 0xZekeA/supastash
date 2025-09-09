import { DEFAULT_CHUNK_SIZE } from "../../../constants/syncDefaults";
import { getSupastashConfig } from "../../../core/config";
import { isOnline } from "../../../utils/connection";
import { normalizeForSupabase } from "../../getSafeValues";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { setQueryStatus } from "../queryStatus";
import { enforceTimestamps } from "./normalize";
import { batchUpsert, fetchRemoteHeadsChunked, filterRowsByUpdatedAt, handleRowFailure, markSynced, singleUpsert, } from "./uploadHelpers";
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
    const ids = chunk.map((row) => row.id);
    // Fetch remote data for the current chunk
    const remoteIds = await fetchRemoteHeadsChunked(table, ids, supabase);
    // Loop through the initial chunk and check if the id is in the remote data
    const toPush = filterRowsByUpdatedAt(table, chunk, remoteIds);
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
    const maxBatchAttempts = config.syncPolicy?.maxBatchAttempts ?? 5;
    let attempts = 0;
    let pending = [...preflightOK];
    while (attempts < maxBatchAttempts && pending.length > 0) {
        let batchOk = false;
        if (onPushToRemote) {
            const ok = await onPushToRemote(pending);
            if (ok)
                batchOk = true;
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
        //Batch failed -> isolate per-row offenders
        const keep = [];
        const syncedNow = [];
        for (const row of pending) {
            const res = onPushToRemote
                ? await (async () => {
                    const ok = await onPushToRemote([row]);
                    return { error: ok ? null : { code: "ROW_FAILED" } };
                })()
                : await singleUpsert(table, row, supabase);
            if (!res.error) {
                syncedNow.push(row.id);
                continue;
            }
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
        const schedule = config.syncPolicy?.backoffDelaysMs ?? [
            10000, 30000, 120000, 300000, 600000,
        ];
        const delay = schedule[Math.min(attempts - 1, schedule.length - 1)];
        await new Promise((r) => setTimeout(r, delay));
        pending = keep;
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
