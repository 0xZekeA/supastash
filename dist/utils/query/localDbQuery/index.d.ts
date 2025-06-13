import { CrudMethods, MethodReturnTypeMap, SupastashQuery } from "../../../types/query.types";
/**
 * Queries the local database
 * @param state - The state of the query
 * @returns The result of the query
 */
export declare function queryLocalDb<T extends CrudMethods, U extends boolean, R, Z>(state: SupastashQuery<T, U, R>): Promise<MethodReturnTypeMap<U, Z>[T]>;
//# sourceMappingURL=index.d.ts.map