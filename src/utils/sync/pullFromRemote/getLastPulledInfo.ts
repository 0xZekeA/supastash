import { getSupaStashDb } from "@/db/dbInitializer";

const DEFAULT_LAST_PULLED_AT = "2024-01-01T00:00:00Z";
const SYNC_STATUS_TABLE = "supastash_sync_status";

/**
 * Gets the last synced timestamp for a given table
 * @param table - The table to get the last synced timestamp for
 * @returns The last synced timestamp
 */
export async function getLastPulledInfo(table: string): Promise<string> {
  const db = await getSupaStashDb();

  // Add table name to supastash_sync_status if it doesn't exist
  await db.runAsync(
    `INSERT OR IGNORE INTO ${SYNC_STATUS_TABLE} (table_name) VALUES (?)`,
    [table]
  );

  // Get the latest sync timestamp for this table
  const result: { last_synced_at: string } | null = await db.getFirstAsync(
    `SELECT last_synced_at FROM ${SYNC_STATUS_TABLE} WHERE table_name = ?`,
    [table]
  );

  const original = result?.last_synced_at || DEFAULT_LAST_PULLED_AT;

  const timestamp = Date.parse(original);
  const lastSyncedAt = new Date(timestamp + 1);

  const lastSyncedAtISOString = lastSyncedAt.toISOString();

  return lastSyncedAtISOString;
}

/**
 * Updates the last synced timestamp for a given table
 * @param table - The table to update the last synced timestamp for
 * @param lastSyncedAt - The last synced timestamp
 */
export async function updateLastPulledInfo(
  table: string,
  lastSyncedAt: string
) {
  const db = await getSupaStashDb();

  await db.runAsync(
    `UPDATE ${SYNC_STATUS_TABLE} SET last_synced_at = ? WHERE table_name = ?`,
    [lastSyncedAt, table]
  );
}
