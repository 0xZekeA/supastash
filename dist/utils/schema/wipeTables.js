import { getSupastashDb } from "../../db/dbInitializer";
import { clearSchemaCache } from "../getTableSchema";
import log from "../logs";
import { getAllTables } from "../sync/getAllTables";
/**
 * Drops a specific table from the local SQLite database and removes its sync metadata.
 *
 * ⚠️ WARNING: This is a destructive operation. It should only be used in development mode,
 * as it will permanently delete all local data for the specified table.
 *
 * @param tableName - Name of the table to drop.
 *
 * @example
 * configureSupastash({
 *   ...
 *   onSchemaInit: async () => {
 *     await wipeTable("users"); // dev-only: clears the "users" table on app start
 *   }
 * });
 */
export async function wipeTable(tableName) {
    try {
        const db = await getSupastashDb();
        await db.runAsync(`DROP TABLE IF EXISTS ${tableName}`);
        await db.runAsync(`DELETE FROM supastash_sync_status WHERE table_name = ?`, [tableName]);
        await db.runAsync(`DELETE FROM supastash_deleted_status WHERE table_name = ?`, [tableName]);
        clearSchemaCache(tableName);
        log(`[Supastash] Dropped table "${tableName}" and cleared sync metadata.`);
    }
    catch (error) {
        log(`[Supastash] Failed to wipe table "${tableName}": ${error}`);
    }
}
/**
 * Drops all local tables managed by Supastash and clears associated sync metadata.
 *
 * ⚠️ WARNING: This will irreversibly delete all local tables and their data.
 * Intended only for development or reset scenarios.
 *
 * @example
 * configureSupastash({
 *   ...
 *   onSchemaInit: async () => {
 *     await wipeAllTables(); // dev-only: clears all local tables on app start
 *   }
 * });
 */
export async function wipeAllTables() {
    try {
        const tables = await getAllTables();
        if (!tables) {
            log("No tables found");
            return;
        }
        for (const table of tables) {
            await wipeTable(table);
        }
    }
    catch (error) {
        log(`[Supastash] Error wiping all tables: ${error}`);
    }
}
/**
 * Wipes old data for a table
 * @param tableName - The name of the table to wipe old data for
 * @param daysFromNow - The number of days from now to wipe old data for
 * @example
 * ```ts
 * // in _layout.tsx or App.tsx or supastash.ts(read more about this in the docs)
 * configureSupastash({
 *  ...
 * onSchemaInit: async () => {
 *  await wipeOldDataForATable("users", 30); // will wipe all data for the users table that is older than 30 days
 * }
 * });
 * ```
 */
export async function wipeOldDataForATable(tableName, daysFromNow) {
    try {
        const db = await getSupastashDb();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysFromNow);
        const isoCutoff = cutoffDate.toISOString();
        await db.runAsync(`DELETE FROM ${tableName} WHERE datetime(created_at) < datetime(?)`, [isoCutoff]);
        log(`[Supastash] Wiped data older than ${daysFromNow} days from "${tableName}".`);
    }
    catch (error) {
        log(`[Supastash] Failed to wipe old data for "${tableName}": ${error}`);
    }
}
/**
 * Deletes old records (based on `created_at`) from all tables, excluding those specified.
 *
 * Only records older than the given number of days will be removed.
 *
 * @param daysFromNow - Cutoff age in days; records older than this will be deleted.
 * @param excludeTables - Optional array of table names to skip during cleanup.
 *
 * @example
 * configureSupastash({
 *   ...
 *   onSchemaInit: async () => {
 *     await wipeOldDataForAllTables(30, ["app_settings"]); // skips wiping "app_settings"
 *   }
 * });
 */
export async function wipeOldDataForAllTables(daysFromNow, excludeTables = []) {
    try {
        const tables = await getAllTables();
        if (!tables) {
            log("No tables found");
            return;
        }
        for (const table of tables) {
            if (excludeTables.includes(table)) {
                continue;
            }
            await wipeOldDataForATable(table, daysFromNow);
        }
    }
    catch (error) {
        log(`[Supastash] Failed to wipe old data for all tables: ${error}`);
    }
}
