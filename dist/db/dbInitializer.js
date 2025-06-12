import { getSupastashConfig } from "../core/config";
import { SQLiteAdapterExpo } from "./adapters/expo_sqlite";
import { SQLiteAdapterNitro } from "./adapters/rn_nitro";
import { SQLiteAdapterStorage } from "./adapters/rn_sqlite_storage";
import { supastashDbErrorMsg } from "./dbErrorMsg";
let db = null;
/**
 * Gets the supastash database
 * @returns The supastash database
 */
export async function getSupastashDb() {
    const config = getSupastashConfig();
    if (!config.sqliteClient || !config.sqliteClientType) {
        throw new Error(supastashDbErrorMsg);
    }
    const client = config.sqliteClient;
    const clientType = config.sqliteClientType;
    if (!db) {
        if (clientType === "expo") {
            db = await SQLiteAdapterExpo.openDatabaseAsync(config.dbName, client);
        }
        else if (clientType === "rn-storage") {
            db = await SQLiteAdapterStorage.openDatabaseAsync(config.dbName, client);
        }
        else if (clientType === "rn-nitro") {
            db = await SQLiteAdapterNitro.openDatabaseAsync(config.dbName, client);
        }
    }
    if (!db) {
        throw new Error(supastashDbErrorMsg);
    }
    return db;
}
