import {
  CrudMethods,
  FilterCalls,
  HandlerMap,
  MethodReturnTypeMap,
  PayloadData,
  SyncMode,
} from "@/types/query.types";
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
  U extends boolean
>(
  table: string,
  method: T,
  select: string | null,
  payload: PayloadData | null,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: U,
  syncMode?: SyncMode
): () => Promise<MethodReturnTypeMap<U>[T]> {
  const handlers: HandlerMap = {
    select: buildSelect<U>(table, select, filters, limit, isSingle),
    insert: buildInsert(table, payload, syncMode),
    update: buildUpdate(table, payload, filters, syncMode),
    delete: buildDelete(table, filters),
    upsert: buildUpsert(table, payload, filters, syncMode),
    none: async () => null,
  };

  return handlers[method];
}
