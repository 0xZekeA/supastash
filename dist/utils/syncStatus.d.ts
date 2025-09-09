/**
 * Clears the sync log for a given table
 * @param tableName - The name of the table to clear the sync status for
 * @example
 * clearLocalSyncLog("users");
 */
export declare function clearLocalSyncLog(tableName: string): Promise<void>;
/**
 * Clears the sync log for all local tables
 * @example
 * clearAllLocalSyncLog();
 */
export declare function clearAllLocalSyncLog(): Promise<void>;
/**
 * Gets the sync log for a given table
 * @param tableName - The name of the table to get the sync log for
 * @example
 * const syncLog = await getLocalSyncLog("users");
 * console.log(syncLog);
 * // { table_name: "users", last_synced_at: "2021-01-01T00:00:00.000Z" }
 */
export declare function getLocalSyncLog(tableName: string): Promise<{
    table_name: string;
    lastSyncedAt: string;
    lastCreatedAt: string;
} | null>;
/**
 * Sets the sync log for a given table
 * @param tableName - The name of the table to set the sync log for
 * @param lastSyncedAt - The last synced at timestamp
 * @param lastCreatedAt - The last created at timestamp
 * @example
 * setLocalSyncLog("users", new Date().toISOString());
 */
export declare function setLocalSyncLog(tableName: string, lastSyncedAt: string, lastCreatedAt?: string): Promise<void>;
/**
 * Clears the delete log for a given table
 * @param tableName - The name of the table to clear the delete log for
 * @example
 * clearLocalDeleteLog("users");
 */
export declare function clearLocalDeleteLog(tableName: string): Promise<void>;
/**
 * Clears the delete status for all local tables
 * @example
 * clearAllLocalDeleteLog();
 */
export declare function clearAllLocalDeleteLog(): Promise<void>;
/**
 * Gets the delete log for a given table
 * @param tableName - The name of the table to get the delete log for
 * @example
 * const deleteLog = await getLocalDeleteLog("users");
 * console.log(deleteLog);
 * // { table_name: "users", last_deleted_at: "2021-01-01T00:00:00.000Z" }
 */
export declare function getLocalDeleteLog(tableName: string): Promise<{
    table_name: string;
    lastDeletedAt: string;
} | null>;
/**
 * Sets the delete log for a given table
 * @param tableName - The name of the table to set the delete log for
 * @param lastDeletedAt - The last deleted at timestamp
 * @example
 * setLocalDeleteLog("users", new Date().toISOString());
 */
export declare function setLocalDeleteLog(tableName: string, lastDeletedAt: string): Promise<void>;
//# sourceMappingURL=syncStatus.d.ts.map