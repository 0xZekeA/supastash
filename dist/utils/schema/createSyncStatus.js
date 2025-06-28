import { getSupastashDb } from "../../db/dbInitializer";
/**
 * Creates the supastash_sync_status table if it doesn't exist
 */
export async function createSyncStatusTable() {
    const db = await getSupastashDb();
    const sql = `CREATE TABLE IF NOT EXISTS supastash_sync_status (
    table_name TEXT NOT NULL,
    last_synced_at TEXT NOT NULL
  );`;
    const sql2 = `CREATE TABLE IF NOT EXISTS supastash_last_created (
    table_name TEXT NOT NULL,
    last_created_at TEXT NOT NULL
  );`;
    await db.execAsync(sql);
    await db.execAsync(sql2);
}
/**
 * Creates the supastash_deleted_status table if it doesn't exist
 */
export async function createDeletedStatusTable() {
    const db = await getSupastashDb();
    const sql = `CREATE TABLE IF NOT EXISTS supastash_deleted_status (
    table_name TEXT NOT NULL,
    last_deleted_at TEXT DEFAULT NULL
  );`;
    await db.execAsync(sql);
}
