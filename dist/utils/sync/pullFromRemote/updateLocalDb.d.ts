import { RealtimeFilter } from "../../../types/realtimeData.types";
/**
 * Updates the local database with the remote changes
 * @param table - The table to update
 */
export declare function updateLocalDb(table: string, filters?: RealtimeFilter[], onReceiveData?: (payload: any) => Promise<void>): Promise<void>;
/**
 * Upserts a record into the local database
 * @param table - The table to upsert the record into
 * @param record - The record to upsert
 * @param exists - Whether the record already exists in the database
 */
export declare function upsertData(table: string, record: any, doesExist?: boolean): Promise<void>;
//# sourceMappingURL=updateLocalDb.d.ts.map