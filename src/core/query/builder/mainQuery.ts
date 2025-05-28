import {
  CrudMethods,
  MethodReturnTypeMap,
  PayloadData,
  SupabaseQueryReturn,
  SupastashQuery,
  SupastashQueryResult,
} from "@/types/query.types";
import { validateQuery } from "@/utils/query/queryValidator";
import { v4 as uuidv4 } from "uuid";
import { queryLocalDb } from "../localDbQuery";
import { querySupabase } from "../remoteQuery/supabaseQuery";

/**
 * Queries the database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function queryDb<T extends CrudMethods, U extends boolean>(
  state: SupastashQuery & { isSingle: U; method: T }
): SupastashQueryResult<T, U> {
  try {
    validateQuery(state);
    const { type, method, filters, table } = state;

    let localResult: MethodReturnTypeMap<U>[T] | null = null;
    let remoteResult: SupabaseQueryReturn<U> | null = null;

    // Add a new id for inserts if not provided
    const newId = uuidv4();

    let newPayload = state.payload;

    if (state.method === "insert" && state.payload && !state.payload.id) {
      newPayload = { ...state.payload, id: newId };
    }

    // Create a new state with the new payload
    const newState = { ...state, payload: newPayload as PayloadData };

    switch (type) {
      case "localFirst":
        localResult = await queryLocalDb<T, U>(newState);
        remoteResult = await querySupabase<U>(newState);
        break;

      case "remoteFirst":
        remoteResult = await querySupabase<U>(newState);
        localResult = await queryLocalDb<T, U>(newState);
        break;

      case "localOnly":
        localResult = await queryLocalDb<T, U>(newState);
        break;

      case "remoteOnly":
        remoteResult = await querySupabase<U>(newState);
        break;

      default:
        throw new Error(`[Supastash] Unknown query type: ${type}`);
    }

    return {
      remote: remoteResult,
      local: localResult,
      success: localResult?.error == null && remoteResult?.error == null,
    };
  } catch (error) {
    console.error(
      `[Supastash] ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      remote: null,
      local: null,
      success: false,
    };
  }
}
