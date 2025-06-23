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
export async function queryLocalDb<
  T extends CrudMethods,
  U extends boolean,
  R,
  Z
>(state: SupastashQuery<T, U, R>): Promise<MethodReturnTypeMap<U, Z>[T]> {
  const {
    table,
    method,
    payload,
    filters,
    limit,
    select,
    isSingle,
    onConflictKeys,
    preserveTimestamp,
    type,
  } = state;

  if (!method) {
    throw new Error("Method is required for local call");
  }

  const query = getLocalMethod<T, U, R, Z>(
    table,
    method,
    select,
    payload,
    filters,
    limit,
    isSingle,
    onConflictKeys,
    type,
    preserveTimestamp
  );

  const result = await query();

  return result;
}
