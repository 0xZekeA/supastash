import { getSupastashDb } from "../../../db/dbInitializer";
import { getTableSchema } from "../../../utils/getTableSchema";
import log from "../../../utils/logs";
import { getRemoteTableSchema } from "../status/remoteSchema";
const sharedKeysCache = new Map();
async function getRemoteKeys(table) {
    if (sharedKeysCache.has(table)) {
        return sharedKeysCache.get(table);
    }
    const remoteSchema = await getRemoteTableSchema(table);
    if (!remoteSchema)
        return null;
    const remoteKeys = remoteSchema.map((col) => col.column_name);
    const localSchema = await getTableSchema(table);
    if (!localSchema)
        return null;
    const localKeys = localSchema;
    const sharedKeys = remoteKeys.filter((key) => localKeys.includes(key));
    const missingKeys = remoteKeys.filter((key) => !localKeys.includes(key) && key !== "synced_at");
    if (missingKeys.length > 0) {
        log(`[Supastash] Missing keys for table ${table}: ${missingKeys.join(", ")}`);
    }
    sharedKeysCache.set(table, sharedKeys);
    return sharedKeys.length ? sharedKeys : null;
}
/**
 * Gets all unsynced data from a table
 * @param table - The table to get the data from
 * @returns The unsynced data
 */
export async function getAllUnsyncedData(table) {
    const db = await getSupastashDb();
    const remoteKeys = await getRemoteKeys(table);
    if (!remoteKeys) {
        const query = `SELECT * FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL`;
        const data = await db.getAllAsync(query);
        return data ?? null;
    }
    const columns = remoteKeys.join(", ");
    const query = `SELECT ${columns} FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL`;
    const data = await db.getAllAsync(query);
    return data ?? null;
}
/**
 * Gets all deleted data from a table
 * @param table - The table to get the data from
 * @returns The deleted data
 */
export async function getAllDeletedData(table) {
    const db = await getSupastashDb();
    const data = await db.getAllAsync(`SELECT deleted_at, id FROM ${table} WHERE deleted_at IS NOT NULL`);
    return data ?? null;
}
