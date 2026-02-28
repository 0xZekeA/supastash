import { SupastashFilter } from "../../../types/realtimeData.types";
import { UpsertDataParams } from "../../../types/syncEngine.types";
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
//# sourceMappingURL=updateLocalDb.d.ts.map