import { RealtimeFilter } from "../../../types/realtimeData.types";
import { SupastashSQLiteDatabase } from "../../../types/supastashConfig.types";
import { SupastashSyncStatus } from "../../../types/syncEngine.types";
import { logWarn } from "../../logs";
import {
  INDEX_SYNC_MARKS_SQL,
  SYNC_STATUS_TABLES_SQL,
} from "../../schema/createSyncStatus";
import { computeFilterKey } from "./filterKey";

const MILLISECOND = 1;
const OLD_DATE = "2000-01-01T00:00:00Z";

const addAMillisecond = (date: string, table: string) => {
  const original = date || OLD_DATE;
  const timestamp = Date.parse(original);
  if (isNaN(timestamp)) {
    logWarn(
      `[Supastash] Invalid date string found on deleted_at column for ${table}: ${original}`
    );
    return original;
  }
  return new Date(timestamp + MILLISECOND).toISOString();
};

const addAMillisecondToSyncStatus = (syncStatus: SupastashSyncStatus) => {
  return {
    ...syncStatus,
    last_created_at: addAMillisecond(
      syncStatus.last_created_at,
      syncStatus.table_name
    ),
    last_synced_at: addAMillisecond(
      syncStatus.last_synced_at,
      syncStatus.table_name
    ),
    last_deleted_at: addAMillisecond(
      syncStatus.last_deleted_at,
      syncStatus.table_name
    ),
  };
};

export async function ensureSyncMarksTable(db: SupastashSQLiteDatabase) {
  await db.execAsync(SYNC_STATUS_TABLES_SQL);
  await db.execAsync(INDEX_SYNC_MARKS_SQL);
}

export async function selectMarks(
  db: SupastashSQLiteDatabase,
  table: string,
  filterKey: string
) {
  return db.getFirstAsync<SupastashSyncStatus>(
    `SELECT * FROM supastash_sync_marks WHERE table_name=? AND filter_key=?`,
    [table, filterKey]
  );
}

export async function selectAndAddAMillisecond(
  db: SupastashSQLiteDatabase,
  table: string,
  tableFilters?: RealtimeFilter[]
): Promise<SupastashSyncStatus> {
  const filterKey = await computeFilterKey(tableFilters ?? []);
  const result = await db.getFirstAsync<SupastashSyncStatus>(
    `SELECT * FROM supastash_sync_marks WHERE table_name=? AND filter_key=?`,
    [table, filterKey]
  );

  if (result) {
    return addAMillisecondToSyncStatus(result);
  }

  return {
    table_name: table,
    filter_key: filterKey,
    filter_json: "{}",
    last_created_at: OLD_DATE,
    last_synced_at: OLD_DATE,
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
    last_created_at = null,
    last_synced_at = null,
    last_deleted_at = null,
  } = row;
  return db.runAsync(
    `INSERT INTO supastash_sync_marks
       (table_name, filter_key, filter_json, last_created_at, last_synced_at, last_deleted_at, updated_at)
       VALUES (?,?,?,?,?,?,datetime('now'))
       ON CONFLICT(table_name, filter_key) DO UPDATE SET
         filter_json     = excluded.filter_json,
         last_created_at = COALESCE(excluded.last_created_at, supastash_sync_marks.last_created_at),
         last_synced_at  = COALESCE(excluded.last_synced_at,  supastash_sync_marks.last_synced_at),
         last_deleted_at = COALESCE(excluded.last_deleted_at, supastash_sync_marks.last_deleted_at),
         updated_at      = datetime('now')`,
    [
      table_name,
      filter_key,
      filter_json,
      last_created_at,
      last_synced_at,
      last_deleted_at,
    ]
  );
}

export async function resetColumn(
  db: SupastashSQLiteDatabase,
  table: string,
  filterKey: string,
  col: "last_synced_at" | "last_created_at" | "last_deleted_at",
  value: string,
  filterJson: string
) {
  return db.runAsync(
    `INSERT INTO supastash_sync_marks (table_name, filter_key, filter_json, ${col}, updated_at)
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
  return filterKey
    ? db.runAsync(
        `DELETE FROM supastash_sync_marks WHERE table_name=? AND filter_key=?`,
        [table, filterKey]
      )
    : db.runAsync(`DELETE FROM supastash_sync_marks WHERE table_name=?`, [
        table,
      ]);
}
