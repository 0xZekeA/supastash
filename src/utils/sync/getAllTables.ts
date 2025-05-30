import { getSupaStashDb } from "@/db/dbInitializer";

const SYNC_STATUS_TABLE = "supastash_%";

export async function getAllTables(): Promise<string[] | null> {
  const db = await getSupaStashDb();

  const tables: { name: string }[] | null = await db.getAllAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE ?`,
    [SYNC_STATUS_TABLE]
  );

  return tables?.map((table) => table.name as string) ?? null;
}
