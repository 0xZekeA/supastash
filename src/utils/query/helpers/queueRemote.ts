import {
  BatchedCall,
  CrudMethods,
  SupastashQuery,
} from "../../../types/query.types";
import { isOnline } from "../../../utils/connection";
import { log, logWarn } from "../../../utils/logs";
import { getQueryStatusFromDb } from "../../../utils/sync/queryStatus";
import { supastashEventBus } from "../../events/eventBus";
import { querySupabase } from "../remoteQuery/supabaseQuery";

let batchQueue: BatchedCall<any, any, any>[] = [];
let isProcessing = false;
let batchTimer: NodeJS.Timeout | number | null = null;

const BATCH_DELAY = 10;
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
  return `${state.table}_${state.method}_${state.id}_${JSON.stringify(
    state.payload
  )}`;
}

export function queueRemoteCall<T extends CrudMethods, U extends boolean, R>(
  state: SupastashQuery<T, U, R>
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const opKey = generateOpKey(state);

    if (successfulCalls.has(opKey)) {
      resolve(true);
      return;
    }

    batchQueue.push({ state, opKey, resolve, reject });
    scheduleBatch();
  });
}

function scheduleBatch(): void {
  if (batchTimer) return;

  batchTimer = setTimeout(() => {
    processBatch();
    batchTimer = null;
  }, BATCH_DELAY);
}

async function processBatch(): Promise<void> {
  if (isProcessing || batchQueue.length === 0) return;

  isProcessing = true;
  const batch = [...batchQueue];
  batchQueue = [];

  for (const call of batch) {
    const { state, opKey, resolve, reject } = call;

    if (successfulCalls.has(opKey)) {
      resolve(true);
      continue;
    }

    try {
      while ((retryCount.get(opKey) ?? 0) <= MAX_RETRIES) {
        const isConnected = await isOnline();

        if (!isConnected) {
          const offlineRetries = (calledOfflineRetries.get(opKey) || 0) + 1;
          calledOfflineRetries.set(opKey, offlineRetries);

          if (offlineRetries > MAX_OFFLINE_RETRIES) {
            if (!seenFailureLog.has(opKey)) {
              seenFailureLog.add(opKey);
              log(
                `[Supastash] Offline — persisted locally, will retry later: ${opKey}`
              );
            }
            await getQueryStatusFromDb(state.table);
            supastashEventBus.emit("updateSyncStatus");
            reject(new Error(`Offline retry limit exceeded for ${opKey}`));
            break;
          }

          await delay(1000);
          continue;
        }

        calledOfflineRetries.delete(opKey);

        const { error } = await querySupabase({ ...state }, true);

        if (!error) {
          successfulCalls.add(opKey);
          retryCount.delete(opKey);
          log(
            `[Supastash] Synced item on ${state.table} with ${state.method} to supabase`
          );
          resolve(true);
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
            reject(new Error(`Duplicate key (23505) for ${opKey}`));
            break;
          }

          if (currentRetries >= MAX_RETRIES) {
            if (!seenFailureLog.has(opKey)) {
              seenFailureLog.add(opKey);
              logWarn(
                `[Supastash] Gave up on ${state.table} with ${state.method} after ${MAX_RETRIES} retries — will retry on next sync \nError message: ${error.message}`
              );
            }
            reject(
              new Error(
                `Max retries exceeded for ${error.message} on ${state.table} with ${state.method}`
              )
            );
            break;
          }

          await delay(1000 * (currentRetries + 1));
        }
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
    }
  }

  isProcessing = false;
}
