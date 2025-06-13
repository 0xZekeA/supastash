import { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";

type SupabaseResult<T> = PostgrestSingleResponse<T>;
export type PayloadData = any;

export type SupabaseQueryReturn<U extends boolean, Z> = U extends true
  ? PostgrestSingleResponse<Z>
  : PostgrestSingleResponse<Z[]>;

type FilterOperations =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "LIKE"
  | "IS"
  | "IN";

export type CrudMethods =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "upsert"
  | "none";

export type FilterCalls = {
  column: string;
  operator: FilterOperations;
  value: any;
};

export interface SupastashQuery<T extends CrudMethods, U extends boolean, R> {
  id: string;
  table: string;
  method: T;
  payload: R | R[] | null;
  filters: FilterCalls[] | null;
  limit: number | null;
  select: string | null;
  isSingle: U;
  type: SyncMode;
  runSelected: boolean;
  viewRemoteResult: boolean;
}

export interface CrudReturnValue {
  error;
}

export type SupastashResult<R> = {
  data: R | null;
  error: {
    message: string;
    name: string;
    supabaseError?: PostgrestError;
  } | null;
};

export type PayloadResult<R> = SupastashResult<R>;
export type PayloadListResult<R> = SupastashResult<R[]>;
export type SupatashDeleteResult<R> = {
  data?: R[] | null;
  error: {
    message: string;
    name: string;
    supabaseError?: PostgrestError;
  } | null;
};

export type MethodReturnTypeMap<U extends boolean, R> = {
  select: U extends true ? SupastashResult<R> : SupastashResult<R[]>;
  insert: U extends true ? SupastashResult<R> : SupastashResult<R[]>;
  update: U extends true ? SupastashResult<R> : SupastashResult<R[]>;
  delete: SupatashDeleteResult<R>;
  upsert: U extends true ? SupastashResult<R> : SupastashResult<R[]>;
  none: null;
};

export type HandlerMap<U extends boolean, R> = {
  [K in CrudMethods]: () => Promise<MethodReturnTypeMap<U, R>[K]>;
};

export type SyncMode =
  | "localFirst"
  | "remoteFirst"
  | "localOnly"
  | "remoteOnly";

export type SupastashQueryResult<
  T extends CrudMethods,
  U extends boolean,
  V extends boolean,
  R
> = V extends true
  ? Promise<{
      remote: SupabaseQueryReturn<U, R> | null;
      local: MethodReturnTypeMap<U, R>[T] | null;
      success: boolean;
    }>
  : MethodReturnTypeMap<U, R>[T] extends { data: infer D; error: infer E }
  ? Promise<{ data: D; error: E; success: boolean }>
  : Promise<{
      data: null;
      error: { message: string } | null;
      success: boolean;
    }>;

export type QueryBuilder<T extends CrudMethods, U extends boolean, R, Z> = {
  eq(column: string, value: any): QueryBuilder<T, U, R, Z>;
  neq(column: string, value: any): QueryBuilder<T, U, R, Z>;
  gt(column: string, value: any): QueryBuilder<T, U, R, Z>;
  lt(column: string, value: any): QueryBuilder<T, U, R, Z>;
  gte(column: string, value: any): QueryBuilder<T, U, R, Z>;
  lte(column: string, value: any): QueryBuilder<T, U, R, Z>;
  like(column: string, value: any): QueryBuilder<T, U, R, Z>;
  is(column: string, value: any): QueryBuilder<T, U, R, Z>;
  in(column: string, value: any[]): QueryBuilder<T, U, R, Z>;
  limit(n: number): QueryBuilder<T, U, R, Z>;
  syncMode(mode: SyncMode): QueryBuilder<T, U, R, Z>;

  // Transitions to U = true when called
  single(): QueryBuilder<T, true, R, Z>;

  // Executes the query
  execute<V extends boolean = false>(
    options?: ExecuteOptions & { viewRemoteResult?: V }
  ): SupastashQueryResult<T, U, V, Z>;
  run<V extends boolean = false>(
    options?: ExecuteOptions & { viewRemoteResult?: V }
  ): SupastashQueryResult<T, U, V, Z>;
  go<V extends boolean = false>(
    options?: ExecuteOptions & { viewRemoteResult?: V }
  ): SupastashQueryResult<T, U, V, Z>;
};

export interface ExecuteOptions {
  /**
   * The number of times to retry the remote query if it fails
   */
  remoteRetry?: number;

  /**
   * Whether to view the remote result
   */
  viewRemoteResult?: boolean;

  /**
   * The delay between remote retries
   */
  remoteRetryDelay?: number;

  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}
