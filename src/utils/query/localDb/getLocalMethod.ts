import {
  CrudMethods,
  FilterCalls,
  HandlerMap,
  MethodReturnTypeMap,
  PayloadData,
} from "@/types/query.types";
import {
  buildDelete,
  buildInsert,
  buildSelect,
  buildUpdate,
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
  isSingle: U
): () => Promise<MethodReturnTypeMap<U>[T]> {
  const handlers: HandlerMap = {
    select: buildSelect<U>(table, select, filters, limit, isSingle),
    insert: buildInsert(table, payload),
    update: buildUpdate(table, payload, filters),
    delete: buildDelete(table, filters),
    none: async () => null,
  };

  return handlers[method];
}
