import { getSupaStashDb } from "@/db/dbInitializer";

async function checkIfTableExist(tableName: string): Promise<boolean> {
  if (!tableName || typeof tableName !== "string") return false;

  const db = await getSupaStashDb();
  const exist = await db.getFirstAsync(
    `SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1;`,
    [tableName]
  );

  return !!exist;
}

export async function assertTableExists(tableName: string) {
  const exists = await checkIfTableExist(tableName);
  if (!exists) {
    throw new Error(
      `${tableName} does not exist in the local database. Define this table using 'defineLocalSchema()' in your config file.`
    );
  }
}
