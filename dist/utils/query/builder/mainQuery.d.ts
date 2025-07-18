import { CrudMethods, SupastashQuery, SupastashQueryResult } from "../../../types/query.types";
/**
 * Queries the database
 * @param state - The state of the query
 * @returns The result of the query
 */
export declare function queryDb<T extends CrudMethods, U extends boolean, V extends boolean, R, Z>(state: SupastashQuery<T, U, R> & {
    viewRemoteResult: V;
}): Promise<SupastashQueryResult<T, U, V, Z>>;
//# sourceMappingURL=mainQuery.d.ts.map