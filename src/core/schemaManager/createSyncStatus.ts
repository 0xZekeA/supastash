import { getSupaStashDb } from "../../db/dbInitializer";

export async function createSyncStatus() {
  const db = await getSupaStashDb();

  const sql = `CREATE TABLE IF NOT EXISTS sync_status (
    table_name TEXT NOT NULL,
    last_synced_at TEXT NOT NULL
  );`;

  await db.execAsync(sql);
}
