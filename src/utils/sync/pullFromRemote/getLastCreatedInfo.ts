import { getSupastashDb } from "../../../db/dbInitializer";
import { logWarn } from "../../logs";

const DEFAULT_LAST_CREATED_AT = "2000-01-01T00:00:00Z";
const LAST_CREATED_TABLE = "supastash_last_created";

/**
 * Gets the last synced timestamp for a given table
 * @param table - The table to get the last created timestamp for
 * @returns The last synced timestamp
 */
export async function getLastCreatedInfo(table: string): Promise<string> {
  const db = await getSupastashDb();

  // Add table name to supastash_last_created if it doesn't exist
  await db.runAsync(
    `INSERT OR IGNORE INTO supastash_last_created (table_name, last_created_at) VALUES (?, ?)`,
    [table, DEFAULT_LAST_CREATED_AT]
  );

  // Get the latest sync timestamp for this table
  const result: { last_created_at: string } | null = await db.getFirstAsync(
    `SELECT last_created_at FROM ${LAST_CREATED_TABLE} WHERE table_name = ?`,
    [table]
  );

  const original = result?.last_created_at || DEFAULT_LAST_CREATED_AT;

  const timestamp = Date.parse(original);
  if (isNaN(timestamp)) {
    logWarn(
      `[Supastash] Invalid date string found on created_at column for ${table}: ${original}`
    );
    return original;
  }
  const lastSyncedAt = new Date(timestamp + 1);

  const lastSyncedAtISOString = lastSyncedAt.toISOString();

  return lastSyncedAtISOString;
}

/**
 * Updates the last synced timestamp for a given table
 * @param table - The table to update the last created timestamp for
 * @param lastCreatedAt - The last created timestamp
 */
export async function updateLastCreatedInfo(
  table: string,
  lastCreatedAt: string
) {
  const db = await getSupastashDb();

  await db.runAsync(
    `UPDATE ${LAST_CREATED_TABLE} SET last_created_at = ? WHERE table_name = ?`,
    [lastCreatedAt, table]
  );
}
