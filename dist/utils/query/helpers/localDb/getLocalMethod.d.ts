import { CrudMethods, MethodReturnTypeMap, SupastashQuery } from "../../../../types/query.types";
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
export default function getLocalMethod<T extends CrudMethods, U extends boolean, R, Z>(state: SupastashQuery<T, U, R>): () => Promise<MethodReturnTypeMap<U, Z>[T]>;
//# sourceMappingURL=getLocalMethod.d.ts.map