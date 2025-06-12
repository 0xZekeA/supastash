import { getSupastashDb } from "../../db/dbInitializer";
const SYNC_STATUS_TABLE = "supastash_%";
export async function getAllTables() {
    const db = await getSupastashDb();
    const tables = await db.getAllAsync(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE ?`, [SYNC_STATUS_TABLE]);
    return tables?.map((table) => table.name) ?? null;
}
