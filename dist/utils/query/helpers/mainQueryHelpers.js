import { isOnline } from "../../../utils/connection";
import { log, logError } from "../../../utils/logs";
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
const stateCache = new Map();
const runningStates = new Set();
const calledOfflineRetries = new Map();
const retryCount = new Map();
const MAX_RETRIES = 2;
const MAX_OFFLINE_RETRIES = 10;
const getOpKey = (state) => `${state.method}:${state.table}:${state.id}`;
function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
export function addToCache(state) {
    const opKey = getOpKey(state);
    if (runningStates.has(opKey))
        return;
    runningStates.add(opKey);
    stateCache.set(opKey, state);
    runRemoteQuery(opKey);
}
async function runRemoteQuery(opKey) {
    const state = stateCache.get(opKey);
    if (!state)
        return;
    retryCount.set(opKey, retryCount.get(opKey) ?? 0);
    try {
        while ((retryCount.get(opKey) ?? 0) <= MAX_RETRIES) {
            const isConnected = await isOnline();
            if (!isConnected) {
                const offlineRetries = (calledOfflineRetries.get(opKey) || 0) + 1;
                if (offlineRetries > MAX_OFFLINE_RETRIES) {
                    logError(`[Supastash] Gave up on ${opKey} after ${MAX_OFFLINE_RETRIES} offline retries`);
                    break;
                }
                calledOfflineRetries.set(opKey, offlineRetries);
                await delay(1000);
                continue;
            }
            calledOfflineRetries.delete(opKey);
            const { error } = await querySupabase({ ...state }, true);
            if (!error) {
                log(`[Supastash] Synced item on ${state.table} with ${state.method} to supabase`);
                break;
            }
            const currentRetry = (retryCount.get(opKey) ?? 0) + 1;
            logError(`[Supastash] Remote sync failed: ${opKey} (${currentRetry}/${MAX_RETRIES}) → ${error.message}`);
            retryCount.set(opKey, currentRetry);
            await delay(100 * currentRetry);
        }
    }
    catch (error) {
        logError(`[Supastash] Error running remote query: ${opKey} → ${error}`);
    }
    finally {
        retryCount.delete(opKey);
        stateCache.delete(opKey);
        runningStates.delete(opKey);
    }
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
                addToCache(state);
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
