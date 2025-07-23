import { isOnline } from "../../../utils/connection";
import { log, logWarn } from "../../../utils/logs";
import { generateUUIDv4 } from "../../genUUID";
import { queryLocalDb } from "../localDbQuery";
import { querySupabase } from "../remoteQuery/supabaseQuery";
export function validatePayloadForSingleInsert(method, isSingle, payload, table) {
    if (isSingle &&
        (method === "insert" || method === "upsert") &&
        Array.isArray(payload)) {
        throw new Error(`.single() cannot be used with array payloads on ${method.toUpperCase()} to ${table}. Use a single object instead.`);
    }
}
export function assignInsertIds(payload) {
    if (!payload)
        return null;
    if (Array.isArray(payload)) {
        return payload.map((item) => ({
            ...item,
            id: item.id ?? generateUUIDv4(),
        }));
    }
    return {
        ...payload,
        id: payload.id ?? generateUUIDv4(),
    };
}
export function getCommonError(table, method, localResult, remoteResult) {
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
                        logWarn(`[Supastash] Gave up on ${opKey} after ${MAX_RETRIES} retries`);
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
export async function runSyncStrategy(state) {
    const { type } = state;
    let localResult = null;
    let remoteResult = null;
    if (state.method === "select") {
        if (state.type.includes("remote")) {
            remoteResult = await querySupabase(state);
            localResult = await queryLocalDb(state);
            return { localResult, remoteResult };
        }
        else {
            localResult = await queryLocalDb(state);
            return { localResult, remoteResult };
        }
    }
    switch (type) {
        case "localOnly":
            localResult = await queryLocalDb(state);
            break;
        case "remoteOnly":
            remoteResult = await querySupabase(state);
            break;
        case "localFirst":
            localResult = await queryLocalDb(state);
            if (state.viewRemoteResult) {
                remoteResult = await querySupabase(state);
            }
            else {
                queueRemoteCall(state);
            }
            break;
        case "remoteFirst":
            remoteResult = await querySupabase(state);
            if (remoteResult?.error) {
                return { localResult: null, remoteResult };
            }
            localResult = await queryLocalDb(state);
            break;
        default:
            throw new Error(`Unknown sync mode: ${type}`);
    }
    return { localResult, remoteResult };
}
