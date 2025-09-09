import { isOnline } from "../../../utils/connection";
import { log, logWarn } from "../../../utils/logs";
import { getQueryStatusFromDb } from "../../../utils/sync/queryStatus";
import { supastashEventBus } from "../../events/eventBus";
import { querySupabase } from "../remoteQuery/supabaseQuery";
let batchQueue = [];
let isProcessing = false;
let batchTimer = null;
const BATCH_DELAY = 10;
const retryCount = new Map();
const calledOfflineRetries = new Map();
const successfulCalls = new Set();
const MAX_RETRIES = 3;
const MAX_OFFLINE_RETRIES = 5;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function generateOpKey(state) {
    return `${state.table}_${state.method}_${state.id}_${JSON.stringify(state.payload)}`;
}
export function queueRemoteCall(state) {
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
function scheduleBatch() {
    if (batchTimer)
        return;
    batchTimer = setTimeout(() => {
        processBatch();
        batchTimer = null;
    }, BATCH_DELAY);
}
async function processBatch() {
    if (isProcessing || batchQueue.length === 0)
        return;
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
                    if (offlineRetries > MAX_OFFLINE_RETRIES) {
                        await getQueryStatusFromDb(state.table);
                        supastashEventBus.emit("updateSyncStatus");
                        logWarn(`[Supastash] Gave up on ${opKey} after ${MAX_OFFLINE_RETRIES} offline retries`);
                        reject(new Error(`Offline retry limit exceeded for ${opKey}`));
                        break;
                    }
                    calledOfflineRetries.set(opKey, offlineRetries);
                    await delay(1000);
                    continue;
                }
                calledOfflineRetries.delete(opKey);
                const { error } = await querySupabase({ ...state }, true);
                if (!error) {
                    successfulCalls.add(opKey);
                    retryCount.delete(opKey);
                    log(`[Supastash] Synced item on ${state.table} with ${state.method} to supabase`);
                    resolve(true);
                    break;
                }
                else {
                    const currentRetries = retryCount.get(opKey) ?? 0;
                    retryCount.set(opKey, currentRetries + 1);
                    if (currentRetries >= MAX_RETRIES) {
                        logWarn(`[Supastash] Gave up on ${opKey} after ${MAX_RETRIES} retries ERROR: ${error.message} will retry on next sync`);
                        logWarn("[Supastash] Full error object:", JSON.stringify(error));
                        reject(new Error(`Max retries exceeded for ${opKey}`));
                        break;
                    }
                    await delay(1000 * (currentRetries + 1));
                }
            }
        }
        catch (error) {
            reject(error);
        }
    }
    isProcessing = false;
}
