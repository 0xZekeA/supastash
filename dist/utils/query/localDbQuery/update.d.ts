import { FilterCalls, PayloadListResult, PayloadResult, SyncMode } from "../../../types/query.types";
/**
 * Updates data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to update
 * @param payload - The payload to update
 * @param filters - The filters to apply to the update query
 * @returns a data / error object
 */
export declare function updateData<T extends boolean, R, Z>(table: string, payload: R | null, filters: FilterCalls[] | null, syncMode?: SyncMode, isSingle?: T, preserveTimestamp?: boolean): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>>;
//# sourceMappingURL=update.d.ts.map