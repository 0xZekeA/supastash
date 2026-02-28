import { getSupastashConfig } from "../../../core/config";
import {
  BatchedCall,
  CrudMethods,
  SupastashQuery,
} from "../../../types/query.types";
import { isOnline } from "../../../utils/connection";
import { generateUUIDv4 } from "../../../utils/genUUID";
import { log, logWarn } from "../../../utils/logs";
import { getQueryStatusFromDb } from "../../../utils/sync/queryStatus";
import { supastashEventBus } from "../../events/eventBus";
import { querySupabase } from "../remoteQuery/supabaseQuery";

let batchQueue: BatchedCall<any, any, any>[] = [];
let isProcessing = false;

const MAX_RETRIES = 3;
const MAX_OFFLINE_RETRIES = 5;

const retryCount = new Map<string, number>();
const calledOfflineRetries = new Map<string, number>();
const successfulCalls = new Set<string>();

const seenFailureLog = new Set<string>();

function isDuplicateKeyError(error: any): boolean {
  return (
    !!error &&
    ((error.code && error.code === "23505") ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("duplicate key")))
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateOpKey<T extends CrudMethods, U extends boolean, R>(
  state: SupastashQuery<T, U, R>
): string {
  return state.id ? state.id : generateUUIDv4();
}

export async function queueRemoteCall<
  T extends CrudMethods,
  U extends boolean,
  R
>(state: SupastashQuery<T, U, R>): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    void reject;
    const opKey = generateOpKey(state);

    if (successfulCalls.has(opKey)) {
      resolve(true);
      return;
    }

    batchQueue.push({ state, opKey, resolve, reject });
    await startWorkerIfNeeded();
  });
}

async function startWorkerIfNeeded(): Promise<void> {
  if (isProcessing) return;
  await processQueue();
}

async function executeSupabaseCall(state: SupastashQuery<any, any, any>) {
  const config = getSupastashConfig();
  const payload = state.payload;

  if (!Array.isArray(payload)) {
    return querySupabase(state, true);
  }

  const batchSize = config.supabaseBatchSize ?? 800;

  for (let i = 0; i < payload.length; i += batchSize) {
    const chunk = payload.slice(i, i + batchSize);

    const result = await querySupabase(
      {
        ...state,
        payload: chunk,
      },
      true
    );

    if (result.error) {
      return result;
    }
  }

  return { error: null };
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (batchQueue.length > 0) {
    const call = batchQueue[0];
    const { state, opKey, resolve } = call;

    if (successfulCalls.has(opKey)) {
      batchQueue.shift();
      resolve(true);
      continue;
    }

    try {
      let shouldRemove = false;
      let isSuccess = false;

      while ((retryCount.get(opKey) ?? 0) <= MAX_RETRIES) {
        const isConnected = await isOnline();

        if (!isConnected) {
          const offlineRetries = (calledOfflineRetries.get(opKey) || 0) + 1;
          calledOfflineRetries.set(opKey, offlineRetries);

          if (offlineRetries > MAX_OFFLINE_RETRIES) {
            if (!seenFailureLog.has(opKey)) {
              seenFailureLog.add(opKey);
              log(
                `[Supastash] Offline — persisted locally, will retry later:  ${state.table} with ${state.method} `
              );
            }
            await getQueryStatusFromDb(state.table);
            supastashEventBus.emit("updateSyncStatus");
            shouldRemove = true;
            isSuccess = false;
            break;
          }

          await delay(1000);
          continue;
        }

        calledOfflineRetries.delete(opKey);

        const { error } = await executeSupabaseCall(state);

        if (!error) {
          successfulCalls.add(opKey);
          retryCount.delete(opKey);
          log(
            `[Supastash] Synced item on ${state.table} with ${state.method} to supabase`
          );
          shouldRemove = true;
          isSuccess = true;
          break;
        } else {
          const currentRetries = retryCount.get(opKey) ?? 0;
          retryCount.set(opKey, currentRetries + 1);

          if (isDuplicateKeyError(error)) {
            if (!seenFailureLog.has(opKey)) {
              seenFailureLog.add(opKey);
              logWarn(
                `[Supastash] Duplicate key on ${state.table} (op=${
                  state.method
                }) — seems already synced; will retry on next full sync: id=${
                  state.id ?? "-"
                }`
              );
            }
            shouldRemove = true;
            isSuccess = true;
            break;
          }

          if (currentRetries >= MAX_RETRIES) {
            if (!seenFailureLog.has(opKey)) {
              seenFailureLog.add(opKey);
              logWarn(
                `[Supastash] Gave up on ${state.table} with ${state.method} after ${MAX_RETRIES} retries — will retry on next sync \nError message: ${error.message}`
              );
            }
            shouldRemove = true;
            isSuccess = false;
            break;
          }

          await delay(1000 * (currentRetries + 1));
        }
      }

      if (shouldRemove) {
        batchQueue.shift();

        resolve(isSuccess);
      }
    } catch (err) {
      if (!seenFailureLog.has(opKey)) {
        seenFailureLog.add(opKey);
        logWarn(
          `[Supastash] Unexpected error processing ${opKey} — ${String(
            (err as Error).message ?? err
          )}`
        );
      }
      batchQueue.shift();
      resolve(false);
    }
  }

  isProcessing = false;
}
