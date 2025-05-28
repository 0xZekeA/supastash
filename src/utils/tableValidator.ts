import { getSupaStashDb } from "@/db/dbInitializer";

/**
 * Checks if the table exists in the local database
 * @param tableName - The name of the table to check
 * @returns true if the table exists, false otherwise
 */
async function checkIfTableExist(tableName: string): Promise<boolean> {
  if (!tableName || typeof tableName !== "string") return false;

  const db = await getSupaStashDb();
  const exist = await db.getFirstAsync(
    `SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1;`,
    [tableName]
  );

  return !!exist;
}

/**
 * Throws an error if the table does not exist
 * @param tableName - The name of the table to check
 */
export async function assertTableExists(tableName: string) {
  const exists = await checkIfTableExist(tableName);
  if (!exists) {
    throw new Error(
      `${tableName} does not exist in the local database. Define this table using 'defineLocalSchema()' in your config file.`
    );
  }
}
