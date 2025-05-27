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
  };

  return handlers[method];
}
