import {
  CrudMethods,
  MethodReturnTypeMap,
  SupastashQuery,
} from "@/types/query.types";
import getLocalMethod from "@/utils/query/localDb/getLocalMethod";

export async function queryLocalDb<T extends CrudMethods, U extends boolean>(
  state: SupastashQuery & { method: T; isSingle: U }
): Promise<MethodReturnTypeMap<U>[T]> {
  const { table, method, payload, filters, limit, select, isSingle } = state;

  if (!method) {
    throw new Error("Method is required for local call");
  }

  const query = getLocalMethod<T, U>(
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
