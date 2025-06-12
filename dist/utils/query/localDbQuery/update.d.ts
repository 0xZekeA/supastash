import { FilterCalls, PayloadListResult, SyncMode } from "../../../types/query.types";
/**
 * Updates data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to update
 * @param payload - The payload to update
 * @param filters - The filters to apply to the update query
 * @returns a data / error object
 */
export declare function updateData<R>(table: string, payload: R | null, filters: FilterCalls[] | null, syncMode?: SyncMode): Promise<PayloadListResult<R>>;
//# sourceMappingURL=update.d.ts.map