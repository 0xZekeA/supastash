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
export declare function wipeTable(tableName: string): Promise<void>;
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
export declare function wipeAllTables(): Promise<void>;
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
export declare function wipeOldDataForATable(tableName: string, daysFromNow: number): Promise<void>;
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
export declare function wipeOldDataForAllTables(daysFromNow: number, excludeTables?: string[]): Promise<void>;
//# sourceMappingURL=wipeTables.d.ts.map