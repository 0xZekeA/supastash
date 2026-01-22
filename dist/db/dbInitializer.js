import { getSupastashConfig } from "../core/config";
import { SQLiteAdapterExpo } from "./adapters/expo_sqlite";
import { SQLiteAdapterNitro } from "./adapters/rn_nitro";
import { SQLiteAdapterStorage } from "./adapters/rn_sqlite_storage";
import { supastashDbErrorMsg } from "./dbErrorMsg";
let db = null;
let dbInitPromise = null;
/**
 * Gets the supastash database
 * @returns The supastash database
 */
export async function getSupastashDb() {
    if (db)
        return db;
    if (dbInitPromise)
        return dbInitPromise;
    dbInitPromise = (async () => {
        const config = getSupastashConfig();
        if (!config.sqliteClient || !config.sqliteClientType) {
            throw new Error(supastashDbErrorMsg);
        }
        const { sqliteClient: client, sqliteClientType: clientType, supastashMode, } = config;
        const resolveDbName = supastashMode === "ghost" ? `${config.dbName}_ghost` : config.dbName;
        switch (clientType) {
            case "expo":
                db = await SQLiteAdapterExpo.openDatabaseAsync(resolveDbName, client);
                break;
            case "rn-storage":
                db = await SQLiteAdapterStorage.openDatabaseAsync(resolveDbName, client);
                break;
            case "rn-nitro":
                db = await SQLiteAdapterNitro.openDatabaseAsync(resolveDbName, client);
                break;
            default:
                throw new Error(`Unsupported SQLite client type: ${clientType}`);
        }
        await db.runAsync("PRAGMA foreign_keys = OFF;");
        return db;
    })();
    return dbInitPromise;
}
export async function closeSupastashDb() {
    if (db) {
        const prevDb = db;
        db = null;
        dbInitPromise = null;
        await prevDb.closeAsync?.();
    }
}
