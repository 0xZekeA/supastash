import {
  CrudMethods,
  MethodReturnTypeMap,
  SupastashQuery,
} from "../../../types/query.types";
import getLocalMethod from "../helpers/localDb/getLocalMethod";

/**
 * Queries the local database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function queryLocalDb<T extends CrudMethods, U extends boolean, R>(
  state: SupastashQuery<T, U, R>
): Promise<MethodReturnTypeMap<U, R>[T]> {
  const { table, method, payload, filters, limit, select, isSingle } = state;

  if (!method) {
    throw new Error("Method is required for local call");
  }

  const query = getLocalMethod<T, U, R>(
    table,
    method,
    select,
    payload,
    filters,
    limit,
    isSingle
  );

  const result = await query();

  return result;
}
