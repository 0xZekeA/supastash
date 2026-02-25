import { getSupastashConfig } from "../../../core/config";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import { SupastashSQLiteDatabase } from "../../../types/supastashConfig.types";
import { SupastashSyncStatus } from "../../../types/syncEngine.types";
import { logWarn } from "../../logs";
import { createSyncStatusTable } from "../../schema/createSyncStatus";
import { computeFilterKey } from "./filterKey";

const OLD_DATE = "2000-01-01T00:00:00Z";
const SYNC_STATUS_TABLE = "supastash_sync_marks";
const SERVER_SYNC_STATUS_TABLE = "supastash_server_sync_marks";
const getSyncStatusTable = () => {
  const cfg = getSupastashConfig();
  return cfg.replicationMode === "server-side"
    ? SERVER_SYNC_STATUS_TABLE
    : SYNC_STATUS_TABLE;
};

const cleanDate = ({
  date,
  table,
  column,
}: {
  date: string;
  table: string;
  column: string;
}) => {
  const original = date || OLD_DATE;
  const d = new Date(original);

  if (Number.isNaN(d?.getTime?.())) {
    logWarn(
      `[Supastash] Invalid date string found on the ${column} column for ${table}: ${original}`
    );
    return original;
  }
  return original;
};

const cleanSyncStatus = (syncStatus: SupastashSyncStatus) => {
  const cfg = getSupastashConfig();
  const lastSyncedAtColumn =
    cfg.replicationMode === "server-side" ? "arrived_at" : "updated_at";
  return {
    ...syncStatus,
    last_synced_at: cleanDate({
      date: syncStatus.last_synced_at,
      table: syncStatus.table_name,
      column: lastSyncedAtColumn,
    }),
    last_deleted_at: cleanDate({
      date: syncStatus.last_deleted_at || OLD_DATE,
      table: syncStatus.table_name,
      column: "deleted_at",
    }),
  };
};

export async function ensureSyncMarksTable() {
  await createSyncStatusTable();
}

export async function selectMarks(
  db: SupastashSQLiteDatabase,
  table: string,
  filterKey: string
) {
  const syncStatusTable = getSyncStatusTable();
  return db.getFirstAsync<SupastashSyncStatus>(
    `SELECT * FROM ${syncStatusTable} WHERE table_name=? AND filter_key=?`,
    [table, filterKey]
  );
}

export async function selectSyncStatus(
  db: SupastashSQLiteDatabase,
  table: string,
  tableFilters?: RealtimeFilter[]
): Promise<SupastashSyncStatus> {
  const filterKey = await computeFilterKey(tableFilters ?? []);
  const syncStatusTable = getSyncStatusTable();
  const result = await db.getFirstAsync<SupastashSyncStatus>(
    `SELECT * FROM ${syncStatusTable} WHERE table_name=? AND filter_key=?`,
    [table, filterKey]
  );

  if (result) {
    return cleanSyncStatus(result);
  }

  return {
    table_name: table,
    filter_key: filterKey,
    filter_json: "{}",
    last_synced_at: OLD_DATE,
    last_synced_at_pk: null,
    last_deleted_at: OLD_DATE,
  };
}

export async function upsertMarks(
  db: SupastashSQLiteDatabase,
  row: Partial<SupastashSyncStatus>
) {
  const {
    table_name,
    filter_key,
    filter_json = null,
    last_synced_at = null,
    last_deleted_at = null,
    last_synced_at_pk = null,
  } = row;
  const syncStatusTable = getSyncStatusTable();
  return db.runAsync(
    `INSERT INTO ${syncStatusTable}
       (table_name, filter_key, filter_json, last_synced_at, last_deleted_at, updated_at, last_synced_at_pk)
       VALUES (?,?,?,?,?,datetime('now'),?)
       ON CONFLICT(table_name, filter_key) DO UPDATE SET
         filter_json     = excluded.filter_json,
         last_synced_at  = COALESCE(excluded.last_synced_at,  ${syncStatusTable}.last_synced_at),
         last_deleted_at = COALESCE(excluded.last_deleted_at, ${syncStatusTable}.last_deleted_at),
         updated_at      = datetime('now'),
         last_synced_at_pk = COALESCE(excluded.last_synced_at_pk, ${syncStatusTable}.last_synced_at_pk)`,
    [
      table_name,
      filter_key,
      filter_json,
      last_synced_at,
      last_deleted_at,
      last_synced_at_pk,
    ]
  );
}

export async function resetColumn(
  db: SupastashSQLiteDatabase,
  table: string,
  filterKey: string,
  col: "last_synced_at" | "last_deleted_at",
  value: string,
  filterJson: string
) {
  const syncStatusTable = getSyncStatusTable();
  return db.runAsync(
    `INSERT INTO ${syncStatusTable} (table_name, filter_key, filter_json, ${col}, updated_at)
       VALUES (?,?,?,?,datetime('now'))
       ON CONFLICT(table_name, filter_key) DO UPDATE SET
         filter_json = excluded.filter_json,
         ${col}      = excluded.${col},
         updated_at  = datetime('now')`,
    [table, filterKey, filterJson, value]
  );
}

export async function deleteMarks(
  db: SupastashSQLiteDatabase,
  table: string,
  filterKey?: string
) {
  const syncStatusTable = getSyncStatusTable();
  return filterKey
    ? db.runAsync(
        `DELETE FROM ${syncStatusTable} WHERE table_name=? AND filter_key=?`,
        [table, filterKey]
      )
    : db.runAsync(`DELETE FROM ${syncStatusTable} WHERE table_name=?`, [table]);
}
