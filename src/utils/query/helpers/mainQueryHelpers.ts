import { PostgrestError } from "@supabase/supabase-js";
import {
  CrudMethods,
  MethodReturnTypeMap,
  SupabaseQueryReturn,
  SupastashQuery,
} from "../../../types/query.types";
import { logWarn } from "../../../utils/logs";
import { generateUUIDv4 } from "../../genUUID";
import { queryLocalDb } from "../localDbQuery";
import { querySupabase } from "../remoteQuery/supabaseQuery";
import { queueRemoteCall } from "./queueRemote";

export function validatePayloadForSingleInsert(
  method: CrudMethods,
  isSingle: boolean,
  payload: unknown,
  table: string
): void {
  if (
    isSingle &&
    (method === "insert" || method === "upsert") &&
    Array.isArray(payload)
  ) {
    throw new Error(
      `.single() cannot be used with array payloads on ${method.toUpperCase()} to ${table}. Use a single object instead.`
    );
  }
}

export function assignInsertIds<R>(
  payload: R | R[] | null
): R | R[] | null | undefined {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      ...item,
      id: (item as any).id ?? generateUUIDv4(),
    }));
  }

  return {
    ...payload,
    id: (payload as any).id ?? generateUUIDv4(),
  } as R;
}

export function getCommonError<U extends boolean, T extends CrudMethods, R, Z>(
  table: string,
  method: CrudMethods,
  localResult: MethodReturnTypeMap<U, Z>[T] | null,
  remoteResult: SupabaseQueryReturn<U, Z> | null
): (Error & { supabaseError?: PostgrestError }) | null {
  if (localResult?.error && !remoteResult?.error) {
    return {
      name: "LocalError",
      message: `Local error: ${localResult.error.message} on ${table} with ${method}`,
    };
  }

  if (localResult?.error && remoteResult?.error) {
    return {
      name: "CommonError",
      message: `Error on ${table} with ${method}\nLocal error: ${localResult.error.message}\nRemote error: ${remoteResult.error.message}`,
    };
  }

  if (!localResult?.error && remoteResult?.error) {
    return {
      name: "RemoteError",
      message: `Remote error: ${remoteResult.error.message} on ${table} with ${method}`,
      supabaseError: remoteResult.error,
    };
  }

  return null;
}

export async function runSyncStrategy<
  T extends CrudMethods,
  U extends boolean,
  R,
  Z
>(
  state: SupastashQuery<T, U, R>
): Promise<{
  localResult: MethodReturnTypeMap<U, Z>[T] | null;
  remoteResult: SupabaseQueryReturn<U, Z> | null;
}> {
  const { type } = state;
  let localResult: MethodReturnTypeMap<U, Z>[T] | null = null;
  let remoteResult: SupabaseQueryReturn<U, Z> | null = null;

  if (state.method === "select") {
    if (state.type.includes("remote")) {
      remoteResult = await querySupabase<U, R, Z>(state);
      localResult = await queryLocalDb<T, U, R, Z>(state);
      return { localResult, remoteResult };
    } else {
      localResult = await queryLocalDb<T, U, R, Z>(state);
      return { localResult, remoteResult };
    }
  }
  const isUpsert = state.method === "upsert";

  switch (type) {
    case "localOnly":
      localResult = await queryLocalDb<T, U, R, Z>(state);
      break;
    case "remoteOnly":
      remoteResult = await querySupabase<U, R, Z>(state);
      break;
    case "localFirst":
      localResult = await queryLocalDb<T, U, R, Z>(state);
      if (state.viewRemoteResult) {
        if (isUpsert) {
          logWarn(
            "Cannot view remote result for upserts. Data will still be synced."
          );
          return { localResult, remoteResult: null };
        }
        remoteResult = await querySupabase<U, R, Z>(state);
      } else {
        if (!isUpsert) {
          queueRemoteCall(state);
        }
      }
      break;
    case "remoteFirst":
      remoteResult = await querySupabase<U, R, Z>(state);
      if (remoteResult?.error) {
        return { localResult: null, remoteResult };
      }
      if (!remoteResult) return { localResult, remoteResult };
      const remoteRows: R[] = Array.isArray(remoteResult.data)
        ? (remoteResult.data as unknown as R[])
        : remoteResult.data
        ? [remoteResult.data as R]
        : [];
      if (remoteRows.length > 0 && isUpsert) {
        const newState = {
          ...state,
          payload: remoteRows,
        } as SupastashQuery<T, U, R>;
        localResult = await queryLocalDb<T, U, R, Z>(newState);
      } else {
        localResult = await queryLocalDb<T, U, R, Z>(state);
      }
      break;
    default:
      throw new Error(`Unknown sync mode: ${type}`);
  }

  return { localResult, remoteResult };
}
