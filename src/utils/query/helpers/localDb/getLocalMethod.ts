import {
  CrudMethods,
  FilterCalls,
  HandlerMap,
  MethodReturnTypeMap,
  SupastashQuery,
  SyncMode,
} from "../../../../types/query.types";
import {
  buildDelete,
  buildInsert,
  buildSelect,
  buildUpdate,
  buildUpsert,
} from "./localQueryBuilder";

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
export default function getLocalMethod<
  T extends CrudMethods,
  U extends boolean,
  R,
  Z
>(
  table: string,
  method: T,
  select: string | null,
  payload: R | R[] | null,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: U,
  state: SupastashQuery<T, U, R>,
  onConflictKeys?: string[],
  syncMode?: SyncMode,
  preserveTimestamp?: boolean
): () => Promise<MethodReturnTypeMap<U, Z>[T]> {
  const handlers: HandlerMap<U, Z> = {
    select: buildSelect<U, R, Z>(
      table,
      select,
      filters,
      limit,
      isSingle
    ) as any,
    insert: buildInsert<U, R, Z>(table, payload, syncMode, isSingle),
    update: buildUpdate<U, R, Z>(
      table,
      payload as R | null,
      filters,
      syncMode,
      isSingle,
      preserveTimestamp
    ) as any,
    delete: buildDelete<Z>(table, filters, syncMode),
    upsert: buildUpsert<U, R, Z>(
      table,
      payload,
      state,
      syncMode,
      isSingle,
      onConflictKeys,
      preserveTimestamp
    ),
    none: async () => null,
  };

  return handlers[method] as () => Promise<MethodReturnTypeMap<U, Z>[T]>;
}
