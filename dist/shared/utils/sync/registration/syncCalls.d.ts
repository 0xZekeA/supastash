import { SyncEntry } from "../../../types/syncEngine.types";
/**
 * Register a sync call (push/pull) for a given table.
 * Prevents overriding existing entries unless allowOverride = true.
 */
export declare function registerSyncCall(table: string, entry: SyncEntry, { allowOverride }?: {
    allowOverride?: boolean;
}): void;
/**
 * Remove a sync call registration for a given table.
 */
export declare function unregisterSyncCall(table: string): void;
/**
 * Retrieve the sync call (push/pull) registered for a given table.
 */
export declare function getSyncCall(table: string): SyncEntry | undefined;
/**
 * Get a list of all registered table names that have sync calls.
 */
export declare function getAllSyncTables(): string[];
/**
 * Clear all sync call registrations.
 */
export declare function clearSyncCalls(): void;
//# sourceMappingURL=syncCalls.d.ts.map