import {
  CrudMethods,
  HandlerMap,
  MethodReturnTypeMap,
  SupastashQuery,
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
>(state: SupastashQuery<T, U, R>): () => Promise<MethodReturnTypeMap<U, Z>[T]> {
  const { method } = state;
  const handlers: HandlerMap<U, Z> = {
    select: buildSelect<U, R, Z>(state),
    insert: buildInsert<U, R, Z>(state),
    update: buildUpdate<U, R, Z>(state),
    delete: buildDelete<Z>(state as any),
    upsert: buildUpsert<U, R, Z>(state),
    none: async () => null,
  };

  return handlers[method] as () => Promise<MethodReturnTypeMap<U, Z>[T]>;
}
