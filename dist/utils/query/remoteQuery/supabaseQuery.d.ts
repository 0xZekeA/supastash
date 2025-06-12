import { CrudMethods, SupabaseQueryReturn, SupastashQuery } from "../../../types/query.types";
/**
 * Queries the supabase database
 * @param state - The state of the query
 * @returns The result of the query
 */
export declare function querySupabase<T extends boolean, R>(state: SupastashQuery<CrudMethods, T, R>, isBatched?: boolean): Promise<SupabaseQueryReturn<T, R>>;
//# sourceMappingURL=supabaseQuery.d.ts.map