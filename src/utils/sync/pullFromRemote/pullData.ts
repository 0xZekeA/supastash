import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
import log, { logWarn } from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { SyncInfoUpdater } from "../queryStatus";
import { computeFilterKey } from "../status/filterKey";
import { selectSyncStatus } from "../status/repo";
import { logNoUpdates, pageThrough, returnMaxDate } from "./helpers";

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
  filters?: SupastashFilter[];
  batchId: string;
}): Promise<{
  data: PayloadData[];
  deletedIds: string[];
  timestamps: {
    updatedMax: string | null;
    deletedMax: string | null;
    updatedMaxPk: string | null;
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
  const syncStatus = await selectSyncStatus(db, table, filters);

  const cfg = getSupastashConfig();

  const tsCol =
    cfg.replicationMode === "server-side" ? "arrived_at" : "updated_at";

  const updatedRows = await pageThrough({
    tsCol,
    since: syncStatus.last_synced_at,
    table,
    filters,
    batchId,
    previousPk: syncStatus.last_synced_at_pk,
  });

  const updatedData: PayloadData[] = [];
  let deletedIds: string[] = [];
  let updatedMax: { value: string; pk: string | null } | null = null;
  let deletedMax: { value: string; pk: string | null } | null = null;
  for (const r of updatedRows) {
    if (!r?.id) {
      logWarn(`[Supastash] Skipped row without id from "${table}"`);
      continue;
    }

    updatedMax = returnMaxDate({
      row: r,
      prevMax: updatedMax,
      col: tsCol,
    });

    // If the row is deleted, add the id to the deleted ids and update the deleted max
    if (r.deleted_at) {
      deletedIds.push(r.id);
      deletedMax = returnMaxDate({
        row: r,
        prevMax: deletedMax,
        col: "deleted_at",
      });
      continue;
    }

    // Push the row to the updated data
    updatedData.push(r);
  }

  if (updatedData.length === 0 && deletedIds.length === 0) {
    logNoUpdates(table);
    return null;
  }

  const timestamps = {
    updatedMax: updatedMax?.value ?? null,
    deletedMax: deletedMax?.value ?? null,
    updatedMaxPk: updatedMax?.pk ?? null,
  };

  log(
    `[Supastash] Received ${
      updatedData.length + deletedIds.length
    } updates for ${table} (u${updatedData.length}/d${deletedIds.length})`
  );
  return { data: updatedData, deletedIds, timestamps };
}
