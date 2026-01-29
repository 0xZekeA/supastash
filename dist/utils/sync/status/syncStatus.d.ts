import { RealtimeFilter } from "../../../types/realtimeData.types";
import { PublicScope, SupastashSyncStatus } from "../../../types/syncEngine.types";
/**
 * Clears the sync log for a specific table.
 *
 * Removes all stored sync checkpoints (created / updated / deleted)
 * for the given table and filter key (if any).
 *
 * @param tableName - Name of the table whose sync status should be cleared.
 * @example
 * await clearLocalSyncLog("users");
 */
export declare function clearLocalSyncLog(tableName: string): Promise<void>;
/**
 * Clears the sync log for every local table.
 *
 * Drops the `supastash_sync_marks` table and recreates it.
 * Use with caution — this wipes all sync history.
 *
 * @example
 * await clearAllLocalSyncLog();
 */
export declare function clearAllLocalSyncLog(): Promise<void>;
/**
 *
 * Returns the stored timestamps and filter info, or `null` if
 * there is no entry for the table.
 * @param tableName - The name of the table to get the sync log for
 * @example
 * const syncLog = await getSyncLog("users");
 * console.log(syncLog);
 * return {
 *    table_name: "users",
 *    last_synced_at: "2021-01-01T00:00:00.000Z",
 *    last_created_at: "2021-01-01T00:00:00.000Z",
 *    last_deleted_at: "2021-01-01T00:00:00.000Z",
 *    filter_key: "1234567890",
 *    filter_json: "[...]",
 *    updated_at: "2021-01-01T00:00:00.000Z"
 * }
 */
export declare function getSyncLog(tableName: string): Promise<SupastashSyncStatus | null>;
/**
 * Writes or updates the sync log for a table.
 *
 * Stores the latest `updated_at` and `updated_at_pk`
 * timestamps for a table + filter combination.
 *
 * @param table - Table name to update.
 * @param filters - Optional realtime filters to scope the log.
 * @param opts - Timestamp fields to set.
 * @example
 * await setSyncLog("users", undefined, {
 *   lastSyncedAt: new Date().toISOString(),
 *   lastSyncedAtPk: "00000000-0000-0000-0000-000000000000",
 * });
 */
export declare function setSyncLog(table: string, filters: RealtimeFilter[] | undefined, opts: {
    lastCreatedAt?: string | null;
    lastSyncedAt?: string | null;
    lastDeletedAt?: string | null;
    lastSyncedAtPk?: string | null;
    filterNamespace?: string;
}): Promise<void>;
/**
 * Resets one or more timestamps in the sync log for a table.
 *
 * @param table - Table to reset.
 * @param filters - Optional filters for a scoped reset.
 * @param scope - Field(s) to reset: "all" (default),
 *   "last_synced_at", "last_created_at", or "last_deleted_at".
 * @example
 * await resetSyncLog("users", undefined, "all");
 */
export declare function resetSyncLog(table: string, filters: RealtimeFilter[] | undefined, scope?: PublicScope): Promise<void>;
/**
 * Deletes the sync log entry for a table (and optional filter key).
 *
 * @param table - Table name.
 * @param filters - Optional filters to target a specific row.
 * @example
 * await clearSyncLog("users");
 */
export declare function clearSyncLog(table: string, filters?: RealtimeFilter[]): Promise<void>;
/** ------------------- DEPRECATED 🗑 Local Sync & Delete Log ------------------- */
/**
 * @deprecated Use `setSyncLog` instead.
 * Sets the sync timestamp for a given table.
 */
export declare function setLocalSyncLog(tableName: string, lastSyncedAt: string, lastCreatedAt?: string): Promise<void>;
/**
 * @deprecated Use `clearSyncLog` instead.
 * Clears the delete log for a given table.
 */
export declare function clearLocalDeleteLog(tableName: string): Promise<void>;
/**
 * @deprecated Use `clearSyncLog` instead.
 * Clears the delete status for all local tables.
 */
export declare function clearAllLocalDeleteLog(): Promise<void>;
/**
 * @deprecated Use `getSyncLog` instead.
 * Gets the delete log for a given table.
 */
export declare function getLocalDeleteLog(tableName: string): Promise<void>;
/**
 * @deprecated Use `setSyncLog` instead.
 * Sets the delete log for a given table.
 */
export declare function setLocalDeleteLog(tableName: string, lastDeletedAt: string): Promise<void>;
//# sourceMappingURL=syncStatus.d.ts.map