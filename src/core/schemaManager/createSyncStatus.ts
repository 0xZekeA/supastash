import { getSupaStashDb } from "@/db/dbInitializer";

/**
 * Creates the sync_status table if it doesn't exist
 */
export async function createSyncStatusTable() {
  const db = await getSupaStashDb();

  const sql = `CREATE TABLE IF NOT EXISTS sync_status (
    table_name TEXT NOT NULL,
    last_synced_at TEXT NOT NULL
  );`;

  await db.execAsync(sql);
}
