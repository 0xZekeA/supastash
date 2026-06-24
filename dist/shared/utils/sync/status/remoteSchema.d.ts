import { TableSchema } from "../../../types/realtimeData.types";
export declare function appendSyncedAt(schema: TableSchema[]): TableSchema[];
/**
 * Fetches column metadata for all supplied tables in a single RPC call
 * and warms both the in-memory cache and the SQLite fallback store.
 *
 * Requires `useBatchSchemaFetch: true` in config and the
 * `get_table_schemas` Postgres function to be deployed.
 *
 * Tables already in the memory cache are skipped.
 * Validation errors for individual tables are logged and skipped —
 * they will surface as normal errors when that table is first used.
 */
export declare function prefetchRemoteTableSchemas(tables: string[]): Promise<void>;
export declare function getRemoteTableSchema(table: string): Promise<TableSchema[] | null>;
//# sourceMappingURL=remoteSchema.d.ts.map