import { getSupastashConfig } from "../core/config";
import { supastashDbErrorMsg } from "./dbErrorMsg";
let db = null;
let dbInitPromise = null;
export async function closeSupastashDb() {
    if (db) {
        const prevDb = db;
        db = null;
        dbInitPromise = null;
        await prevDb.closeAsync?.();
    }
}
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
        // Remove ALL static adapter imports at the top
        switch (clientType) {
            case "expo": {
                const { SQLiteAdapterExpo } = await import("./adapters/expo_sqlite");
                db = await SQLiteAdapterExpo.openDatabaseAsync(resolveDbName, client);
                break;
            }
            case "rn-storage": {
                const { SQLiteAdapterStorage } = await import("./adapters/rn_sqlite_storage");
                db = await SQLiteAdapterStorage.openDatabaseAsync(resolveDbName, client);
                break;
            }
            case "tauri": {
                const { SQLiteAdapterTauri } = await import("./adapters/tauri");
                db = await SQLiteAdapterTauri.openDatabaseAsync(resolveDbName, client);
                break;
            }
            case "rn-nitro": {
                const { SQLiteAdapterNitro } = await import("./adapters/rn_nitro");
                db = await SQLiteAdapterNitro.openDatabaseAsync(resolveDbName, client);
                break;
            }
            default:
                throw new Error(`Unsupported SQLite client type: ${clientType}`);
        }
        // We turn off foreign key checks to avoid issues with the sync engine
        await db?.runAsync("PRAGMA foreign_keys = OFF;");
        if (!db) {
            throw new Error("[Supastash] Failed to initialize the database");
        }
        return db;
    })();
    return dbInitPromise;
}
