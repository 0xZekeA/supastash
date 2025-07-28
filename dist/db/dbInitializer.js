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
    const { sqliteClient: client, sqliteClientType: clientType } = config;
    if (!db) {
        switch (clientType) {
            case "expo":
                db = await SQLiteAdapterExpo.openDatabaseAsync(config.dbName, client);
                break;
            case "rn-storage":
                db = await SQLiteAdapterStorage.openDatabaseAsync(config.dbName, client);
                break;
            case "rn-nitro":
                db = await SQLiteAdapterNitro.openDatabaseAsync(config.dbName, client);
                break;
            default:
                throw new Error(`Unsupported SQLite client type: ${clientType}`);
        }
        await db.runAsync("PRAGMA foreign_keys = OFF;");
    }
    return db;
}
