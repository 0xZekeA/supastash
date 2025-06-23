import { CrudMethods, FilterCalls, MethodReturnTypeMap, SyncMode } from "../../../../types/query.types";
/**
 * Gets method for local db calls
 *
 * @param table - The name of the table to query
 * @param method - The method to call
 * @param select - The columns to select
 * @param payload - The payload to insert
 * @param filters - The filters to apply
 * @param limit - The limit to apply
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns query
 */
export default function getLocalMethod<T extends CrudMethods, U extends boolean, R, Z>(table: string, method: T, select: string | null, payload: R | R[] | null, filters: FilterCalls[] | null, limit: number | null, isSingle: U, onConflictKeys?: string[], syncMode?: SyncMode, preserveTimestamp?: boolean): () => Promise<MethodReturnTypeMap<U, Z>[T]>;
//# sourceMappingURL=getLocalMethod.d.ts.map