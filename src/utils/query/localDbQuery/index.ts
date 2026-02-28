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
  const { method } = state;

  if (!method) {
    throw new Error("[Supastash] Method is required for local call");
  }

  const query = getLocalMethod<T, U, R, Z>(state);

  const result = await query();

  return result;
}
