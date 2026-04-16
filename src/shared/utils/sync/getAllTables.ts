import { getSupastashDb } from "../../db/dbInitializer";

const SYNC_STATUS_TABLE = "supastash_%";

export async function getAllTables(): Promise<string[] | null> {
  const db = await getSupastashDb();

  const tables: { name: string }[] | null = await db.getAllAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE ? AND name not like '_sqlx_%' AND name not like 'sqlx_%'`,
    [SYNC_STATUS_TABLE]
  );

  return tables?.map((table) => table.name as string) ?? null;
}
