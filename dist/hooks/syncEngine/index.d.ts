/**
 * Syncs the local data to the remote database
 */
export declare function syncAll(force?: boolean): Promise<void>;
export declare function useSyncEngine(): {
    startSync: () => void;
    stopSync: () => void;
};
/**
 * Manually syncs a **single** table with Supabase.
 *
 * This function:
 * - Pulls remote data into local SQLite (if a pull handler is registered)
 * - Pushes unsynced local data to Supabase
 * - Skips syncing if already in progress for this table
 * - Applies filter if `useFiltersFromStore` is enabled
 *
 * Use this for explicit sync triggers (e.g., pull-to-refresh).
 *
 * @param {string} table - The name of the table to sync.
 * @returns {Promise<void>}
 */
export declare function syncTable(table: string): Promise<void>;
/**
 * Manually syncs **all registered tables** with Supabase.
 *
 * This function:
 * - Triggers a full sync of all registered tables
 * - Forces a sync outside the normal polling schedule
 * - Skips any table that is already syncing
 *
 * Useful for global refreshes (e.g., on app foreground).
 *
 * @returns {Promise<void>}
 */
export declare function syncAllTables(): Promise<void>;
//# sourceMappingURL=index.d.ts.map