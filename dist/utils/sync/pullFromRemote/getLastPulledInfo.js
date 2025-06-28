import { getSupastashDb } from "../../../db/dbInitializer";
import { logWarn } from "../../logs";
const DEFAULT_LAST_PULLED_AT = "2000-01-01T00:00:00Z";
const SYNC_STATUS_TABLE = "supastash_sync_status";
/**
 * Gets the last synced timestamp for a given table
 * @param table - The table to get the last synced timestamp for
 * @returns The last synced timestamp
 */
export async function getLastPulledInfo(table) {
    const db = await getSupastashDb();
    // Add table name to supastash_sync_status if it doesn't exist
    await db.runAsync(`INSERT OR IGNORE INTO supastash_sync_status (table_name, last_synced_at) VALUES (?, ?)`, [table, DEFAULT_LAST_PULLED_AT]);
    // Get the latest sync timestamp for this table
    const result = await db.getFirstAsync(`SELECT last_synced_at FROM ${SYNC_STATUS_TABLE} WHERE table_name = ?`, [table]);
    const original = result?.last_synced_at || DEFAULT_LAST_PULLED_AT;
    const timestamp = Date.parse(original);
    if (isNaN(timestamp)) {
        logWarn(`[Supastash] Invalid date string found on updated_at column for ${table}: ${original}`);
        return original;
    }
    const lastSyncedAt = new Date(timestamp + 1);
    const lastSyncedAtISOString = lastSyncedAt.toISOString();
    return lastSyncedAtISOString;
}
/**
 * Updates the last synced timestamp for a given table
 * @param table - The table to update the last synced timestamp for
 * @param lastSyncedAt - The last synced timestamp
 */
export async function updateLastPulledInfo(table, lastSyncedAt) {
    const db = await getSupastashDb();
    await db.runAsync(`UPDATE ${SYNC_STATUS_TABLE} SET last_synced_at = ? WHERE table_name = ?`, [lastSyncedAt, table]);
}
