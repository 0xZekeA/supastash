import { getSupastashDb } from "../db/dbInitializer";
import { logWarn } from "./logs";
import { createDeletedStatusTable, createSyncStatusTable, } from "./schema/createSyncStatus";
const SYNC_STATUS_TABLE = "supastash_sync_status";
const DELETED_STATUS_TABLE = "supastash_deleted_status";
const LAST_CREATED_TABLE = "supastash_last_created";
/**
 * Clears the sync log for a given table
 * @param tableName - The name of the table to clear the sync status for
 * @example
 * clearLocalSyncLog("users");
 */
export async function clearLocalSyncLog(tableName) {
    const db = await getSupastashDb();
    await db.runAsync(`DELETE FROM ${SYNC_STATUS_TABLE} WHERE table_name = ?`, [
        tableName,
    ]);
    await db.runAsync(`DELETE FROM ${LAST_CREATED_TABLE} WHERE table_name = ?`, [
        tableName,
    ]);
}
/**
 * Clears the sync log for all local tables
 * @example
 * clearAllLocalSyncLog();
 */
export async function clearAllLocalSyncLog() {
    const db = await getSupastashDb();
    await db.runAsync(`DROP TABLE IF EXISTS ${SYNC_STATUS_TABLE}`);
    await db.runAsync(`DROP TABLE IF EXISTS ${LAST_CREATED_TABLE}`);
    await createSyncStatusTable();
}
/**
 * Gets the sync log for a given table
 * @param tableName - The name of the table to get the sync log for
 * @example
 * const syncLog = await getLocalSyncLog("users");
 * console.log(syncLog);
 * // { table_name: "users", last_synced_at: "2021-01-01T00:00:00.000Z" }
 */
export async function getLocalSyncLog(tableName) {
    const db = await getSupastashDb();
    const syncStatus = await db.getFirstAsync(`SELECT * FROM ${SYNC_STATUS_TABLE} WHERE table_name = ?`, [tableName]);
    if (!syncStatus) {
        return null;
    }
    return syncStatus;
}
/**
 * Sets the sync log for a given table
 * @param tableName - The name of the table to set the sync log for
 * @param lastSyncedAt - The last synced at timestamp
 * @param lastCreatedAt - The last created at timestamp
 * @example
 * setLocalSyncLog("users", new Date().toISOString());
 */
export async function setLocalSyncLog(tableName, lastSyncedAt, lastCreatedAt) {
    const db = await getSupastashDb();
    if (lastSyncedAt) {
        await db.runAsync(`INSERT OR REPLACE INTO ${SYNC_STATUS_TABLE} (table_name, last_synced_at) VALUES (?, ?)`, [tableName, lastSyncedAt]);
    }
    else {
        logWarn(`No last synced at timestamp for table ${tableName}`);
    }
    if (lastCreatedAt) {
        await db.runAsync(`INSERT OR REPLACE INTO ${LAST_CREATED_TABLE} (table_name, last_created_at) VALUES (?, ?)`, [tableName, lastCreatedAt]);
    }
}
/**
 * Clears the delete log for a given table
 * @param tableName - The name of the table to clear the delete log for
 * @example
 * clearLocalDeleteLog("users");
 */
export async function clearLocalDeleteLog(tableName) {
    const db = await getSupastashDb();
    await db.runAsync(`DELETE FROM ${DELETED_STATUS_TABLE} WHERE table_name = ?`, [tableName]);
}
/**
 * Clears the delete status for all local tables
 * @example
 * clearAllLocalDeleteLog();
 */
export async function clearAllLocalDeleteLog() {
    const db = await getSupastashDb();
    await db.runAsync(`DROP TABLE IF EXISTS ${DELETED_STATUS_TABLE}`);
    await createDeletedStatusTable();
}
/**
 * Gets the delete log for a given table
 * @param tableName - The name of the table to get the delete log for
 * @example
 * const deleteLog = await getLocalDeleteLog("users");
 * console.log(deleteLog);
 * // { table_name: "users", last_deleted_at: "2021-01-01T00:00:00.000Z" }
 */
export async function getLocalDeleteLog(tableName) {
    const db = await getSupastashDb();
    const deleteStatus = await db.getFirstAsync(`SELECT * FROM ${DELETED_STATUS_TABLE} WHERE table_name = ?`, [tableName]);
    if (!deleteStatus) {
        return null;
    }
    return deleteStatus;
}
/**
 * Sets the delete log for a given table
 * @param tableName - The name of the table to set the delete log for
 * @param lastDeletedAt - The last deleted at timestamp
 * @example
 * setLocalDeleteLog("users", new Date().toISOString());
 */
export async function setLocalDeleteLog(tableName, lastDeletedAt) {
    const db = await getSupastashDb();
    await db.runAsync(`INSERT OR REPLACE INTO ${DELETED_STATUS_TABLE} (table_name, last_deleted_at) VALUES (?, ?)`, [tableName, lastDeletedAt]);
}
