import { getSupastashDb } from "../db/dbInitializer";
/**
 * Updates synced_at from null to a timeStamp
 * @param tableName - The name of the table to update
 * @param id - The id of the row to update
 */
export async function updateLocalSyncedAt(tableName, id) {
    try {
        const db = await getSupastashDb();
        const timeStamp = new Date().toISOString();
        await db.runAsync(`UPDATE ${tableName} SET synced_at = ? WHERE id = ?`, [
            timeStamp,
            id,
        ]);
    }
    catch (error) {
        console.error(error);
    }
}
