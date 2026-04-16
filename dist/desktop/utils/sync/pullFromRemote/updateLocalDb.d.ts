import { SupastashFilter } from "../../../../shared/types/realtimeData.types";
import { UpsertDataParams } from "../../../../shared/types/syncEngine.types";
/**
 * Updates the local database with the remote changes
 * @param table - The table to update
 */
export declare function updateLocalDb(table: string, filters?: SupastashFilter[], onReceiveData?: (payload: any) => Promise<void>): Promise<void>;
/**
 * Upserts a record into the local database
 * @param table - The table to upsert the record into
 * @param record - The record to upsert
 * @param exists - Whether the record already exists in the database
 */
export declare function upsertData({ tx, table, record, doesExist, }: UpsertDataParams): Promise<void>;
/**
    •	Bulk upserts records into a local SQLite table using a batched, conflict-aware strategy.
    •
    •	This function:
    •		•	Fetches existing id and updated_at values in bulk to avoid per-row queries
    •		•	Filters incoming records to only include new or more recent entries
    •		•	Performs batched INSERT ... ON CONFLICT(id) DO UPDATE operations
    •	while respecting SQLite parameter limits
    •		•	Updates synced_at for successfully written records
    •
    •	Designed for high-performance sync scenarios in offline-first apps.
    •
    •	Key guarantees:
    •		•	Avoids N+1 query patterns (no per-row existence checks)
    •		•	Minimizes disk I/O pressure via batching
    •		•	Safe for large datasets when used with chunking
    •
    •	Notes:
    •		•	Assumes id is the primary or unique key
    •		•	Requires updated_at for conflict resolution (falls back if missing)
    •		•	Respects SQLite parameter limit (~999 variables per query)
    •
    •	@param tx Optional transaction instance. If not provided, a connection is used directly.
    •	@param table Target table name
    •	@param records Array of records to upsert
*/
export declare function upsertChunkData({ tx, table, records, }: {
    tx?: any;
    table: string;
    records: any[];
}): Promise<void>;
//# sourceMappingURL=updateLocalDb.d.ts.map