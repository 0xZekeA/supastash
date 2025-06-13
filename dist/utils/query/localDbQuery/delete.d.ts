import { FilterCalls, SupatashDeleteResult, SyncMode } from "../../../types/query.types";
/**
 * Soft delete: Sets `deleted_at` timestamp based on provided filters.
 * @param table - The name of the table to delete from
 * @param filters - The filters to apply to the delete query
 * @returns The result of the delete query
 */
export declare function deleteData<Z = any>(table: string, filters: FilterCalls[] | null, syncMode?: SyncMode): Promise<SupatashDeleteResult<Z>>;
/**
 * Hard delete: Permanently removes a row by its `id`.
 * @param table - The name of the table to delete from
 * @param id - The id of the row to delete
 * @returns The result of the delete query
 */
export declare function permanentlyDeleteData<R = any>(table: string, filters: FilterCalls[] | null): Promise<SupatashDeleteResult<R>>;
//# sourceMappingURL=delete.d.ts.map