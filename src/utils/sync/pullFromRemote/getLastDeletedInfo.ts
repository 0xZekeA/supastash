import { getSupastashDb } from "../../../db/dbInitializer";
import { logWarn } from "../../logs";

const DEFAULT_LAST_DELETED_AT = "2000-01-01T00:00:00Z";
const DELETED_STATUS_TABLE = "supastash_deleted_status";

/**
 * Gets the last deleted timestamp for a given table
 * @param table - The table to get the last deleted timestamp for
 * @returns The last deleted timestamp
 */
export async function getLastDeletedInfo(table: string): Promise<string> {
  const db = await getSupastashDb();

  // Add table name to supastash_deleted_status if it doesn't exist
  await db.runAsync(
    `INSERT OR IGNORE INTO ${DELETED_STATUS_TABLE} (table_name, last_deleted_at) VALUES (?, ?)`,
    [table, DEFAULT_LAST_DELETED_AT]
  );

  // Get the latest deleted timestamp for this table
  const result: { last_deleted_at: string } | null = await db.getFirstAsync(
    `SELECT last_deleted_at FROM ${DELETED_STATUS_TABLE} WHERE table_name = ?`,
    [table]
  );

  const original = result?.last_deleted_at || DEFAULT_LAST_DELETED_AT;

  const timestamp = Date.parse(original);
  if (isNaN(timestamp)) {
    logWarn(
      `[Supastash] Invalid date string found on deleted_at column for ${table}: ${original}`
    );
    return original;
  }
  const lastDeletedAt = new Date(timestamp + 1);

  const lastDeletedAtISOString = lastDeletedAt.toISOString();

  return lastDeletedAtISOString;
}

/**
 * Updates the last deleted timestamp for a given table
 * @param table - The table to update the last deleted timestamp for
 * @param lastDeletedAt - The last deleted timestamp
 */
export async function updateLastDeletedInfo(
  table: string,
  lastDeletedAt: string
) {
  const db = await getSupastashDb();

  await db.runAsync(
    `UPDATE ${DELETED_STATUS_TABLE} SET last_deleted_at = ? WHERE table_name = ?`,
    [lastDeletedAt, table]
  );
}
