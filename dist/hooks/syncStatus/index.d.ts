/**
 * React hook that returns the current global sync status across all tracked Supastash tables.
 *
 * - Listens for the "updateSyncStatus" event from the event bus.
 * - Recomputes sync status whenever the event is emitted (e.g. after CRUD operations).
 * - Status can be:
 *   - "pending" → at least one table has pending sync rows
 *   - "error" → at least one table has failed sync rows
 *   - "synced" → all tracked tables are fully synced
 *
 * @returns {"pending" | "error" | "synced"} The current sync status
 *
 * @example
 * const syncStatus = useSupastashSyncStatus();
 * if (syncStatus === "pending") showSyncingIndicator();
 */
export declare function useSupastashSyncStatus(): "error" | "pending" | "synced";
//# sourceMappingURL=index.d.ts.map