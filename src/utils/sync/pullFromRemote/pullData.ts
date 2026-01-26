import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import log, { logWarn } from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { SyncInfoUpdater } from "../queryStatus";
import { computeFilterKey } from "../status/filterKey";
import { selectAndAddAMillisecond } from "../status/repo";
import { getMaxDate, logNoUpdates, pageThrough } from "./helpers";

/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export async function pullData({
  table,
  filters,
  batchId,
}: {
  table: string;
  filters?: RealtimeFilter[];
  batchId: string;
}): Promise<{
  data: PayloadData[];
  deletedIds: string[];
  timestamps: {
    createdMax: string | null;
    updatedMax: string | null;
    deletedMax: string | null;
  };
} | null> {
  const supabase = getSupastashConfig().supabaseClient;
  if (!supabase)
    throw new Error(`No supabase client found: ${supabaseClientErr}`);

  SyncInfoUpdater.setLastSyncLog({
    key: "filterJson",
    value: filters ?? [],
    type: "pull",
    table,
  });
  SyncInfoUpdater.setLastSyncLog({
    key: "filterKey",
    value: (await computeFilterKey(filters, "global")) ?? "",
    type: "pull",
    table,
  });

  const db = await getSupastashDb();
  const { last_created_at, last_synced_at, last_deleted_at } =
    await selectAndAddAMillisecond(db, table, filters);

  const [createdRows, updatedRows, deletedRows] = await Promise.all([
    pageThrough({
      tsCol: "created_at",
      since: last_created_at,
      table,
      filters,
      batchId,
    }),
    pageThrough({
      tsCol: "updated_at",
      since: last_synced_at,
      table,
      filters,
      batchId,
    }),
    pageThrough({
      tsCol: "deleted_at",
      since: last_deleted_at,
      includeDeleted: true,
      select: "id, deleted_at",
      table,
      filters,
      batchId,
    }),
  ]);
  const merged: Record<string, PayloadData> = {};
  for (const r of [...createdRows, ...updatedRows]) {
    if (!r?.id) {
      logWarn(`[Supastash] Skipped row without id from "${table}"`);
      continue;
    }
    merged[r.id] = r;
  }
  const data = Object.values(merged);
  if (data.length === 0 && deletedRows.length === 0) {
    logNoUpdates(table);
    return null;
  }

  const deletedIds = deletedRows.map((r) => r.id);

  const timestamps = {
    createdMax: getMaxDate(createdRows, "created_at"),

    updatedMax: getMaxDate(updatedRows, "updated_at"),
    deletedMax: getMaxDate(deletedRows, "deleted_at"),
  };

  log(
    `[Supastash] Received ${
      data.length + deletedRows.length
    } updates for ${table} (c${createdRows.length}/u${updatedRows.length}/d${
      deletedRows.length
    })`
  );
  return { data, deletedIds, timestamps };
}
