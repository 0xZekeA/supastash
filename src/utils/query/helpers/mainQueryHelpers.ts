import { PostgrestError } from "@supabase/supabase-js";
import {
  CrudMethods,
  MethodReturnTypeMap,
  SupabaseQueryReturn,
  SupastashQuery,
} from "../../../types/query.types";
import { isOnline } from "../../../utils/connection";
import log, { logError } from "../../../utils/logs";
import { generateUUIDv4 } from "../../genUUID";
import { queryLocalDb } from "../localDbQuery";
import { querySupabase } from "../remoteQuery/supabaseQuery";

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

let stateCache: SupastashQuery<CrudMethods, boolean, any>[] = [];
const pendingIds = new Set<string>();
let isRunning = false;
const MAX_RETRIES = 2;
const MAX_OFFLINE_RETRIES = 10;
const calledOfflineRetries = new Map<string, number>();
const retryDelay = 1000 * 30;

function enqueueState(query: SupastashQuery<CrudMethods, boolean, any>) {
  if (pendingIds.has(query.id)) return;
  stateCache.push(query);
  pendingIds.add(query.id);
}

async function runBatchedRemoteQuery<U extends boolean, R, Z>() {
  if (isRunning) return;
  isRunning = true;

  while (stateCache.length > 0) {
    const isConnected = await isOnline();
    const state = stateCache.shift()!;
    if (
      calledOfflineRetries.get(state.id) &&
      calledOfflineRetries.get(state.id)! >= MAX_OFFLINE_RETRIES
    ) {
      logError(
        `[Supastash] Failed to send remote batch query:\n` +
          `  Table: ${state.table}\n` +
          `  Method: ${state.method}\n` +
          `  Retries: ${MAX_OFFLINE_RETRIES}\n` +
          `  Retrying in ${retryDelay}ms`
      );
      calledOfflineRetries.delete(state.id);

      batchTimer = setTimeout(() => {
        isRunning = false;
        if (!isRunning) runBatchedRemoteQuery<U, R, Z>();
        batchTimer = null;
      }, retryDelay);
      return;
    }
    if (!isConnected) {
      if (!calledOfflineRetries.has(state.id)) {
        log(
          `[Supastash] Not connected to internet\n` +
            `  Table: ${state.table}\n` +
            `  Method: ${state.method}\n` +
            `  Retries: ${MAX_OFFLINE_RETRIES}\n`
        );
      }
      stateCache.unshift(state);
      calledOfflineRetries.set(
        state.id,
        (calledOfflineRetries.get(state.id) || 0) + 1
      );
      await delay(1000);
      continue;
    }

    calledOfflineRetries.delete(state.id);

    const retryCount = (state as any).retryCount || 0;

    const { error } = await querySupabase<U, R, Z>(
      {
        ...(state as SupastashQuery<CrudMethods, U, any>),
        isSingle: state.isSingle as U,
      },
      true
    );

    if (error) {
      if (retryCount < MAX_RETRIES) {
        (state as any).retryCount = retryCount + 1;
        stateCache.unshift(state);
        await delay(100 * retryCount);
        continue;
      } else {
        logError(
          `[Supastash] Remote sync failed on ${state.table} with ${
            state.method
          } after ${retryCount + 1} tries: ${error.message}`
        );
      }
    }
  }

  isRunning = false;
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

let batchTimer: number | NodeJS.Timeout | null = null;

function addToCache<U extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, U, R>
) {
  enqueueState(state);
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    runBatchedRemoteQuery<U, R, Z>();
  }, 200);
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
        remoteResult = await querySupabase<U, R, Z>(state);
      } else {
        addToCache<U, R, Z>(state);
      }
      break;
    case "remoteFirst":
      remoteResult = await querySupabase<U, R, Z>(state);
      if (remoteResult?.error) {
        return { localResult: null, remoteResult };
      }
      localResult = await queryLocalDb<T, U, R, Z>(state);
      break;
    default:
      throw new Error(`Unknown sync mode: ${type}`);
  }

  return { localResult, remoteResult };
}
