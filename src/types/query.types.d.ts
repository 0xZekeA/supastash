import { PostgrestSingleResponse } from "@supabase/supabase-js";

type SupabaseResult<T> = PostgrestSingleResponse<T>;

type SupabaseQueryReturn<T extends boolean> = T extends true
  ? SupabaseResult<PayloadData> // if isSingle is true → return a single row
  : SupabaseResult<PayloadData[]>; // if false → return an array

export type PayloadData = Record<string, any>;
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

export interface SupastashQuery {
  table: string;
  method: CrudMethods;
  payload: PayloadData | null;
  filters: FilterCalls[] | null;
  limit: number | null;
  select: string | null;
  isSingle: boolean;
  type: SyncMode;
  runSelected: boolean;
}

export interface CrudReturnValue {
  error;
}

export type SupastashResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

export type PayloadResult = SupastashResult<PayloadData>;
export type PayloadListResult = SupastashResult<PayloadData[]>;
export type SupatashDeleteResult = { error: { message: string } | null };

export type MethodReturnTypeMap<U extends boolean> = {
  select: U extends true
    ? SupastashResult<PayloadData>
    : SupastashResult<PayloadData[]>;
  insert: PayloadResult;
  update: PayloadListResult;
  delete: SupatashDeleteResult;
  upsert: PayloadListResult;
  none: null; // if no method is selected
};

export type HandlerMap = {
  [K in CrudMethods]: () => Promise<MethodReturnTypeMap[K]>;
};

export type SyncMode =
  | "localFirst"
  | "remoteFirst"
  | "localOnly"
  | "remoteOnly";

export type SupastashQueryResult<
  T extends CrudMethods,
  U extends boolean
> = Promise<{
  remote: SupabaseQueryReturn<U> | null;
  local: MethodReturnTypeMap<U>[T] | null; // if isSingle is true → return a single row
  success: boolean;
}>;

export type QueryBuilder<T extends CrudMethods, U extends boolean> = {
  eq(column: string, value: any): QueryBuilder<T, U>;
  neq(column: string, value: any): QueryBuilder<T, U>;
  gt(column: string, value: any): QueryBuilder<T, U>;
  lt(column: string, value: any): QueryBuilder<T, U>;
  gte(column: string, value: any): QueryBuilder<T, U>;
  lte(column: string, value: any): QueryBuilder<T, U>;
  like(column: string, value: any): QueryBuilder<T, U>;
  is(column: string, value: any): QueryBuilder<T, U>;
  in(column: string, value: any[]): QueryBuilder<T, U>;
  limit(n: number): QueryBuilder<T, U>;
  syncMode(mode: SyncMode): QueryBuilder<T, U>;

  // Transitions to U = true when called
  single(): QueryBuilder<T, true>;

  // Executes the query
  execute(): SupastashQueryResult<T, U>;
  run(): SupastashQueryResult<T, U>;
  go(): SupastashQueryResult<T, U>;
};

export interface ExecuteOptions {
  remoteRetry?: number;

  remoteRetryDelay?: number;

  debug?: boolean;
}
