import { FilterCalls, PayloadListResult, PayloadResult } from "../../../types/query.types";
/**
 * Selects one or many rows from the local database.
 *
 * @param table - The name of the table to select from
 * @param select - The columns to select
 * @param filters - The filters to apply to the select query
 * @param limit - The limit to apply to the select query
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns a data / error object
 */
export declare function selectData<T extends boolean, R, Z>(table: string, select: string, filters: FilterCalls[] | null, limit: number | null, isSingle: T): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>>;
//# sourceMappingURL=select.d.ts.map