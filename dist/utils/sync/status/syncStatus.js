import { getSupastashDb } from "../../../db/dbInitializer";
import { logError } from "../../logs";
import { createSyncStatusTable } from "../../schema/createSyncStatus";
import { clearSupastashSyncStatus, getSupastashSyncStatus, resetSupastashSyncStatus, setSupastashSyncStatus, } from "./services";
const SYNC_STATUS_TABLE = "supastash_sync_marks";
/**
 * Clears the sync log for a specific table.
 *
 * Removes all stored sync checkpoints (created / updated / deleted)
 * for the given table and filter key (if any).
 *
 * @param tableName - Name of the table whose sync status should be cleared.
 * @example
 * await clearLocalSyncLog("users");
 */
export async function clearLocalSyncLog(tableName) {
    await clearSupastashSyncStatus(tableName);
}
/**
 * Clears the sync log for every local table.
 *
 * Drops the `supastash_sync_marks` table and recreates it.
 * Use with caution — this wipes all sync history.
 *
 * @example
 * await clearAllLocalSyncLog();
 */
export async function clearAllLocalSyncLog() {
    const db = await getSupastashDb();
    await db.runAsync(`DROP TABLE IF EXISTS ${SYNC_STATUS_TABLE}`);
    await createSyncStatusTable();
}
/**
 *
 * Returns the stored timestamps and filter info, or `null` if
 * there is no entry for the table.
 * @param tableName - The name of the table to get the sync log for
 * @example
 * const syncLog = await getSyncLog("users");
 * console.log(syncLog);
 * return {
 *    table_name: "users",
 *    last_synced_at: "2021-01-01T00:00:00.000Z",
 *    last_created_at: "2021-01-01T00:00:00.000Z",
 *    last_deleted_at: "2021-01-01T00:00:00.000Z",
 *    filter_key: "1234567890",
 *    filter_json: "[...]",
 *    updated_at: "2021-01-01T00:00:00.000Z"
 * }
 */
export async function getSyncLog(tableName) {
    try {
        const syncStatus = await getSupastashSyncStatus(tableName);
        return syncStatus;
    }
    catch (error) {
        logError(error);
        return null;
    }
}
/**
 * Writes or updates the sync log for a table.
 *
 * Stores the latest `created_at`, `updated_at`, and/or `deleted_at`
 * timestamps for a table + filter combination.
 *
 * @param table - Table name to update.
 * @param filters - Optional realtime filters to scope the log.
 * @param opts - Timestamp fields to set.
 * @example
 * await setSyncLog("users", undefined, {
 *   lastSyncedAt: new Date().toISOString(),
 *   lastCreatedAt: new Date().toISOString(),
 * });
 */
export async function setSyncLog(table, filters, opts) {
    try {
        await setSupastashSyncStatus(table, filters, opts);
    }
    catch (e) {
        logError(`[Supastash] setMarks(${table}) failed`, e);
    }
}
/**
 * Resets one or more timestamps in the sync log for a table.
 *
 * @param table - Table to reset.
 * @param filters - Optional filters for a scoped reset.
 * @param scope - Field(s) to reset: "all" (default),
 *   "last_synced_at", "last_created_at", or "last_deleted_at".
 * @example
 * await resetSyncLog("users", undefined, "all");
 */
export async function resetSyncLog(table, filters, scope = "all") {
    try {
        await resetSupastashSyncStatus(table, filters, scope);
    }
    catch (e) {
        logError(`[Supastash] resetMarks(${table}, ${scope}) failed`, e);
    }
}
/**
 * Deletes the sync log entry for a table (and optional filter key).
 *
 * @param table - Table name.
 * @param filters - Optional filters to target a specific row.
 * @example
 * await clearSyncLog("users");
 */
export async function clearSyncLog(table, filters) {
    try {
        await clearSupastashSyncStatus(table, filters);
    }
    catch (e) {
        logError(`[Supastash] clearMarks(${table}) failed`, e);
    }
}
/** ------------------- DEPRECATED 🗑 Local Sync & Delete Log ------------------- */
/**
 * @deprecated Use `setSyncLog` instead.
 * Sets the sync timestamp for a given table.
 */
export async function setLocalSyncLog(tableName, lastSyncedAt, lastCreatedAt) {
    return;
}
/**
 * @deprecated Use `clearSyncLog` instead.
 * Clears the delete log for a given table.
 */
export async function clearLocalDeleteLog(tableName) {
    return;
}
/**
 * @deprecated Use `clearSyncLog` instead.
 * Clears the delete status for all local tables.
 */
export async function clearAllLocalDeleteLog() {
    return;
}
/**
 * @deprecated Use `getSyncLog` instead.
 * Gets the delete log for a given table.
 */
export async function getLocalDeleteLog(tableName) {
    return;
}
/**
 * @deprecated Use `setSyncLog` instead.
 * Sets the delete log for a given table.
 */
export async function setLocalDeleteLog(tableName, lastDeletedAt) {
    return;
}
