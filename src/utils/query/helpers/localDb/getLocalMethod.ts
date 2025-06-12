import {
  CrudMethods,
  FilterCalls,
  HandlerMap,
  MethodReturnTypeMap,
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
  R
>(
  table: string,
  method: T,
  select: string | null,
  payload: R | R[] | null,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: U,
  syncMode?: SyncMode
): () => Promise<MethodReturnTypeMap<U, R>[T]> {
  const handlers: HandlerMap<U, R> = {
    select: buildSelect<U>(table, select, filters, limit, isSingle) as any,
    insert: buildInsert<U, R>(table, payload, syncMode, isSingle),
    update: buildUpdate<R>(
      table,
      payload as R | null,
      filters,
      syncMode
    ) as any,
    delete: buildDelete(table, filters, syncMode),
    upsert: buildUpsert<U, R>(table, payload, syncMode, isSingle),
    none: async () => null,
  };

  return handlers[method] as () => Promise<MethodReturnTypeMap<U, R>[T]>;
}
