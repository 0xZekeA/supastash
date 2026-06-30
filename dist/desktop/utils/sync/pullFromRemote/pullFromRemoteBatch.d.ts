/**
 * Batch pull: fetches all tables in a single RPC call per round,
 * looping until `remaining_tables` is empty.
 *
 * Requires `useBatchPullSync: true` in config and the
 * `supastash_pull_sync` Postgres function to be deployed.
 */
export declare function pullFromRemoteBatch(specificTables?: string[]): Promise<void>;
//# sourceMappingURL=pullFromRemoteBatch.d.ts.map