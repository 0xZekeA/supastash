import { PostgrestError } from "@supabase/supabase-js";
import { CrudMethods, MethodReturnTypeMap, SupabaseQueryReturn, SupastashQuery } from "../../../types/query.types";
export declare function validatePayloadForSingleInsert(method: CrudMethods, isSingle: boolean, payload: unknown, table: string): void;
export declare function assignInsertIds<R>(payload: R | R[] | null): R | R[] | null | undefined;
export declare function getCommonError<U extends boolean, T extends CrudMethods, R>(table: string, method: CrudMethods, localResult: MethodReturnTypeMap<U, R>[T] | null, remoteResult: SupabaseQueryReturn<U, R> | null): (Error & {
    supabaseError?: PostgrestError;
}) | null;
export declare function runSyncStrategy<T extends CrudMethods, U extends boolean, R>(state: SupastashQuery<T, U, R>): Promise<{
    localResult: MethodReturnTypeMap<U, R>[T] | null;
    remoteResult: SupabaseQueryReturn<U, R> | null;
}>;
//# sourceMappingURL=mainQueryHelpers.d.ts.map