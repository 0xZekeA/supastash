import {
  CrudMethods,
  MethodReturnTypeMap,
  SupabaseQueryReturn,
  SupastashQuery,
  SupastashQueryResult,
} from "@/types/query.types";
import { validateQuery } from "@/utils/query/queryValidator";
import { queryLocalDb } from "../localDbQuery";
import { querySupabase } from "../remoteQuery/supabaseQuery";

export async function queryDb<T extends CrudMethods, U extends boolean>(
  state: SupastashQuery & { isSingle: U; method: T }
): SupastashQueryResult<T, U> {
  validateQuery(state);
  const { type } = state;

  let localResult: MethodReturnTypeMap<U>[T] | null = null;
  let remoteResult: SupabaseQueryReturn<U> | null = null;

  switch (type) {
    case "localFirst":
      localResult = await queryLocalDb<T, U>(state);
      remoteResult = await querySupabase<U>(state);
      break;

    case "remoteFirst":
      remoteResult = await querySupabase<U>(state);
      localResult = await queryLocalDb<T, U>(state);
      break;

    case "localOnly":
      localResult = await queryLocalDb<T, U>(state);
      break;

    case "remoteOnly":
      remoteResult = await querySupabase<U>(state);
      break;

    default:
      throw new Error(`[Supastash] Unknown query type: ${type}`);
  }

  return {
    remote: remoteResult,
    local: localResult,
    success: localResult?.error == null && remoteResult?.error == null,
  };
}
