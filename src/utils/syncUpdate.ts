import { getSupaStashDb } from "@/db/dbInitializer";

/**
 * Updates synced_at from null to a timeStamp
 * @param id
 */
export async function updateLocalSyncedAt(tableName: string, id: string) {
  try {
    const db = await getSupaStashDb();
    const timeStamp = new Date().toISOString();

    await db.runAsync(`UPDATE ${tableName} SET synced_at = ? WHERE id = ?`, [
      timeStamp,
      id,
    ]);
  } catch (error) {
    console.error(error);
  }
}
