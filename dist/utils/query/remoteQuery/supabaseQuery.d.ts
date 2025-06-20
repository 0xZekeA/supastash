import { CrudMethods, SupabaseQueryReturn, SupastashQuery } from "../../../types/query.types";
/**
 * Queries the supabase database
 * @param state - The state of the query
 * @param isBatched - Whether the query is batched
 * @returns The result of the query
 */
export declare function querySupabase<T extends boolean, R, Z>(state: SupastashQuery<CrudMethods, T, R>, isBatched?: boolean): Promise<SupabaseQueryReturn<T, Z>>;
//# sourceMappingURL=supabaseQuery.d.ts.map