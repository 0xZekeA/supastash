import { getSupaStashDb } from "@/db/dbInitializer";
import { PayloadData } from "@/types/query.types";

/**
 * Gets all unsynced data from a table
 * @param table - The table to get the data from
 * @returns The unsynced data
 */
export async function getAllUnsyncedData(
  table: string
): Promise<PayloadData[] | null> {
  const db = await getSupaStashDb();
  const data: PayloadData[] | null = await db.getAllAsync(
    `SELECT * FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL`
  );
  return data ?? null;
}

/**
 * Gets all deleted data from a table
 * @param table - The table to get the data from
 * @returns The deleted data
 */
export async function getAllDeletedData(
  table: string
): Promise<PayloadData[] | null> {
  const db = await getSupaStashDb();
  const data: PayloadData[] | null = await db.getAllAsync(
    `SELECT * FROM ${table} WHERE deleted_at IS NOT NULL`
  );
  return data ?? null;
}
