import { getSupastashDb } from "../db/dbInitializer";
import { logError } from "./logs";

/**
 * Updates synced_at from null to a timeStamp
 * @param tableName - The name of the table to update
 * @param id - The id of the row to update
 */
export async function updateLocalSyncedAt(tableName: string, id: string) {
  try {
    const db = await getSupastashDb();
    const timeStamp = new Date().toISOString();

    await db.runAsync(`UPDATE ${tableName} SET synced_at = ? WHERE id = ?`, [
      timeStamp,
      id,
    ]);
  } catch (error) {
    logError(error);
  }
}
