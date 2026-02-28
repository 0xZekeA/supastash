import { CrudMethods, FilterCalls, SupastashQuery, SupatashDeleteResult } from "../../../types/query.types";
import { SupastashSQLiteExecutor } from "../../../types/supastashConfig.types";
/**
 * Soft delete: Sets `deleted_at` timestamp based on provided filters.
 * @param table - The name of the table to delete from
 * @param filters - The filters to apply to the delete query
 * @returns The result of the delete query
 */
export declare function deleteData<Z = any>(state: SupastashQuery<CrudMethods, boolean, Z>): Promise<SupatashDeleteResult<Z>>;
/**
 * Hard delete: Permanently removes a row by its `id`.
 * @param table - The name of the table to delete from
 * @param id - The id of the row to delete
 * @returns The result of the delete query
 */
export declare function permanentlyDeleteData<R = any>({ table, filters, tx, throwOnError, }: {
    table: string;
    filters: FilterCalls[] | null;
    tx: SupastashSQLiteExecutor | null;
    throwOnError?: boolean;
}): Promise<SupatashDeleteResult<R>>;
//# sourceMappingURL=delete.d.ts.map