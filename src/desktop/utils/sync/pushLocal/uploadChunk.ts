import { DEFAULT_CHUNK_SIZE } from "../../../../shared/constants/syncDefaults";
import { getSupastashConfig } from "../../../../shared/core/config";
import { PayloadData } from "../../../../shared/types/query.types";
import { RowLike } from "../../../../shared/types/syncEngine.types";
import { isOnline } from "../../../../shared/utils/connection";
import { normalizeForSupabase } from "../../../../shared/utils/getSafeValues";
import log from "../../../../shared/utils/logs";
import { supabaseClientErr } from "../../../../shared/utils/supabaseClientErr";
import { enforceTimestamps } from "../../../../shared/utils/sync/pushLocal/normalize";
import {
  setQueryStatus,
  SyncInfoUpdater,
} from "../../../../shared/utils/sync/queryStatus";
import {
  backoff,
  batchUpsert,
  fetchRemoteHeadsChunked,
  filterRowsByUpdatedAt,
  handleRowFailure,
  markSynced,
  rpcUpsert,
  rpcUpsertSingle,
  singleUpsert,
} from "./uploadHelpers";

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
async function uploadChunk(
  table: string,
  chunk: PayloadData[],
  onPushToRemote?: (payload: any) => Promise<boolean>
) {
  const config = getSupastashConfig();
  const supabase = config.supabaseClient;

  if (!supabase) {
    throw new Error(supabaseClientErr);
  }

  let errorCount = 0;
  let lastError: Error | null = null;

  let pending: RowLike[] = [];
  const hasRPCPath = !!config.pushRPCPath;

  const ids: string[] = chunk.map((row) => row.id);

  const toPush: RowLike[] = [];
  let remoteExistsMap: Map<string, boolean> = new Map();

  // If we have a RPC path, we can push the whole chunk. Server validates freshness.
  if (hasRPCPath) {
    toPush.push(...chunk);
  } else {
    // Fetch remote data for the current chunk
    const remoteIds = await fetchRemoteHeadsChunked(table, ids, supabase);
    for (const id of ids) remoteExistsMap.set(id, remoteIds.has(id));

    // Loop through the initial chunk and check if the id is in the remote data
    const filtered = filterRowsByUpdatedAt(table, chunk, remoteIds);
    toPush.push(...filtered);
  }
  if (toPush.length === 0) return;

  const preflightOK: RowLike[] = [];
  if (config.syncPolicy?.ensureParents) {
    for (const r of toPush) {
      try {
        const status = await config.syncPolicy.ensureParents(table, r);
        if (status === "blocked") {
          setQueryStatus(r.id, table, "error");
          continue;
        }
        preflightOK.push(r);
      } catch (e) {
        setQueryStatus(r.id, table, "error");
        log(`[Supastash] ensureParents failed for ${table}:${r.id}`, e);
      }
    }
  } else {
    preflightOK.push(...toPush);
  }
  if (preflightOK.length === 0) return;
  pending.push(...preflightOK);

  const maxBatchAttempts = config.syncPolicy?.maxBatchAttempts ?? 5;
  let attempts = 0;

  while (attempts < maxBatchAttempts && pending.length > 0) {
    let batchOk = false;
    // RPC return values
    let completed: RowLike[] = [];
    let existsMap: Map<string, boolean> = new Map(remoteExistsMap);

    if (onPushToRemote) {
      const ok = await onPushToRemote(pending);
      if (ok) batchOk = true;
    } else if (hasRPCPath) {
      const res = await rpcUpsert({ table, rows: pending, supabase });
      completed = res.data.completed;
      pending = [...res.data.skipped];
      existsMap = res.data.existsMap;
      batchOk = res.error == null && pending.length === 0;
      if (res.error) {
        if (!(await isOnline())) {
          attempts++;
          await backoff(attempts);
          pending = [...preflightOK];
          continue;
        }
        // Online: RPC failed — run per-row single upserts immediately, no retry.
        // pending was reassigned to res.data.skipped (empty on error), so use preflightOK.
        const rowsToProcess = [...preflightOK];
        try {
          const heads = await fetchRemoteHeadsChunked(
            table,
            rowsToProcess.map((r) => r.id),
            supabase
          );
          for (const r of rowsToProcess) existsMap.set(r.id, heads.has(r.id));
        } catch {
          // existsMap stays empty — singleUpsert will fall back to upsert
        }
        const syncedNow: string[] = [];
        const keep: RowLike[] = [];
        for (const row of rowsToProcess) {
          const rowRes = await singleUpsert(table, row, supabase, existsMap);
          if (!rowRes.error) {
            syncedNow.push(row.id);
            continue;
          }
          errorCount++;
          lastError = rowRes.error;
          const decision = await handleRowFailure(
            config,
            table,
            row,
            rowRes.error,
            supabase
          );
          if (decision !== "KEEP") continue;
          keep.push(row);
        }
        if (syncedNow.length) await markSynced(table, syncedNow);
        pending = keep;
        break;
      }
    } else {
      const { error } = await batchUpsert(table, pending, supabase);
      if (!error) batchOk = true;
    }

    if (batchOk) {
      await markSynced(
        table,
        pending.map((r) => r.id)
      );
      return;
    }
    if (completed.length > 0) {
      await markSynced(
        table,
        completed.map((r) => r.id)
      );
    }

    //Batch failed -> isolate per-row offenders
    const keep: RowLike[] = [];
    const syncedNow: string[] = [];

    for (const row of pending) {
      let res: any = null;
      if (onPushToRemote) {
        const ok = await onPushToRemote([row]);
        res = { error: ok ? null : { code: "ROW_FAILED" } };
      } else if (hasRPCPath) {
        res = await rpcUpsertSingle({ table, row, supabase, existsMap });
      } else {
        res = await singleUpsert(table, row, supabase, existsMap);
      }

      if (!res.error) {
        syncedNow.push(row.id);
        continue;
      }
      errorCount++;
      lastError = res.error;

      const decision = await handleRowFailure(
        config,
        table,
        row,
        res.error,
        supabase
      );

      if (decision === "DROP" || decision === "REPLACED") {
        continue;
      }

      keep.push(row); // retry later
    }
    if (syncedNow.length) await markSynced(table, syncedNow);
    if (keep.length === 0) return;

    if (!(await isOnline())) {
      attempts++;
      await backoff(attempts);
      pending = keep;
    } else {
      // Online: errors are genuine failures, not network issues — don't retry
      for (const r of keep) setQueryStatus(r.id, table, "error");
      pending = keep; // update pending so post-loop markLogError reflects only true failures
      break;
    }
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
  for (const r of pending) setQueryStatus(r.id, table, "error");
}

/**
 * Uploads a chunk of data to the remote database
 * @param table - The table to upload to
 * @param unsyncedRecords - The unsynced records to upload
 */
export async function uploadData(
  table: string,
  unsyncedRecords: PayloadData[],
  onPushToRemote?: (payload: any[]) => Promise<boolean>
) {
  const cfg = getSupastashConfig();
  const supabase = cfg.supabaseClient;
  if (!supabase) throw new Error("[Supastash] Supabase client not configured");

  const cleaned = unsyncedRecords.map(
    ({ synced_at, deleted_at, arrived_at, ...rest }) =>
      enforceTimestamps(normalizeForSupabase(rest))
  );

  for (let i = 0; i < cleaned.length; i += DEFAULT_CHUNK_SIZE) {
    const chunk = cleaned.slice(i, i + DEFAULT_CHUNK_SIZE);
    await uploadChunk(table, chunk, onPushToRemote);
  }
}
