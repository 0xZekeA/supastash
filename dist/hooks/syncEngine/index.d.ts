/**
 * Push then (optionally) pull.
 * - Single flight across entire app via module-scoped flags.
 * - Both directions gated on connectivity.
 * - "force" ignores pull cadence timing.
 */
export declare function syncAll(force?: boolean): Promise<void>;
/**
 * Hook to start/stop the periodic sync engine.
 * - Staggers push & pull timers.
 * - Debounced foreground trigger.
 * - Shares module-level single-flight guards with syncAll().
 */
export declare function useSyncEngine(): {
    startSync: () => void;
    stopSync: () => void;
};
/**
 * Manually sync a single table (pull then push for that table).
 * - Uses table-specific handlers from syncCalls if provided.
 * - Respects configured filters when enabled.
 */
export declare function syncTable(table: string): Promise<void>;
/**
 * Force a global sync pass now (push then pull if due).
 */
export declare function syncAllTables(): Promise<void>;
//# sourceMappingURL=index.d.ts.map