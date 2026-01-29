import { logWarn } from "../../logs";
import { createSyncStatusTable } from "../../schema/createSyncStatus";
import { computeFilterKey } from "./filterKey";
const OLD_DATE = "2000-01-01T00:00:00Z";
const cleanDate = (date, table) => {
    const original = date || OLD_DATE;
    const timestamp = Date.parse(original);
    if (isNaN(timestamp)) {
        logWarn(`[Supastash] Invalid date string found on deleted_at column for ${table}: ${original}`);
        return original;
    }
    return original;
};
const cleanSyncStatus = (syncStatus) => {
    return {
        ...syncStatus,
        last_created_at: cleanDate(syncStatus.last_created_at, syncStatus.table_name),
        last_synced_at: cleanDate(syncStatus.last_synced_at, syncStatus.table_name),
        last_deleted_at: cleanDate(syncStatus.last_deleted_at || OLD_DATE, syncStatus.table_name),
    };
};
export async function ensureSyncMarksTable() {
    await createSyncStatusTable();
}
export async function selectMarks(db, table, filterKey) {
    return db.getFirstAsync(`SELECT * FROM supastash_sync_marks WHERE table_name=? AND filter_key=?`, [table, filterKey]);
}
export async function selectSyncStatus(db, table, tableFilters) {
    const filterKey = await computeFilterKey(tableFilters ?? []);
    const result = await db.getFirstAsync(`SELECT * FROM supastash_sync_marks WHERE table_name=? AND filter_key=?`, [table, filterKey]);
    if (result) {
        return cleanSyncStatus(result);
    }
    return {
        table_name: table,
        filter_key: filterKey,
        filter_json: "{}",
        last_created_at: OLD_DATE,
        last_synced_at: OLD_DATE,
        last_synced_at_pk: null,
        last_deleted_at: OLD_DATE,
    };
}
export async function upsertMarks(db, row) {
    const { table_name, filter_key, filter_json = null, last_created_at = null, last_synced_at = null, last_deleted_at = null, last_synced_at_pk = null, } = row;
    return db.runAsync(`INSERT INTO supastash_sync_marks
       (table_name, filter_key, filter_json, last_created_at, last_synced_at, last_deleted_at, updated_at, last_synced_at_pk)
       VALUES (?,?,?,?,?,?,datetime('now'),?)
       ON CONFLICT(table_name, filter_key) DO UPDATE SET
         filter_json     = excluded.filter_json,
         last_created_at = COALESCE(excluded.last_created_at, supastash_sync_marks.last_created_at),
         last_synced_at  = COALESCE(excluded.last_synced_at,  supastash_sync_marks.last_synced_at),
         last_deleted_at = COALESCE(excluded.last_deleted_at, supastash_sync_marks.last_deleted_at),
         updated_at      = datetime('now'),
         last_synced_at_pk = COALESCE(excluded.last_synced_at_pk, supastash_sync_marks.last_synced_at_pk)`, [
        table_name,
        filter_key,
        filter_json,
        last_created_at,
        last_synced_at,
        last_deleted_at,
        last_synced_at_pk,
    ]);
}
export async function resetColumn(db, table, filterKey, col, value, filterJson) {
    return db.runAsync(`INSERT INTO supastash_sync_marks (table_name, filter_key, filter_json, ${col}, updated_at)
       VALUES (?,?,?,?,datetime('now'))
       ON CONFLICT(table_name, filter_key) DO UPDATE SET
         filter_json = excluded.filter_json,
         ${col}      = excluded.${col},
         updated_at  = datetime('now')`, [table, filterKey, filterJson, value]);
}
export async function deleteMarks(db, table, filterKey) {
    return filterKey
        ? db.runAsync(`DELETE FROM supastash_sync_marks WHERE table_name=? AND filter_key=?`, [table, filterKey])
        : db.runAsync(`DELETE FROM supastash_sync_marks WHERE table_name=?`, [
            table,
        ]);
}
