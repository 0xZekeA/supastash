import { isOnline } from "../../../utils/connection";
import log from "../../../utils/logs";
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
let stateCache = [];
let isRunning = false;
const MAX_RETRIES = 2;
const MAX_OFFLINE_RETRIES = 10;
const calledOfflineRetries = new Map();
const retryDelay = 1000 * 30;
async function runBatchedRemoteQuery() {
    if (isRunning)
        return;
    isRunning = true;
    while (stateCache.length > 0) {
        const isConnected = await isOnline();
        const state = stateCache.shift();
        if (calledOfflineRetries.get(state.id) &&
            calledOfflineRetries.get(state.id) >= MAX_OFFLINE_RETRIES) {
            console.error(`[Supastash] Failed to send remote batch query:\n` +
                `  Table: ${state.table}\n` +
                `  Method: ${state.method}\n` +
                `  Retries: ${MAX_OFFLINE_RETRIES}\n` +
                `  Retrying in ${retryDelay}ms`);
            calledOfflineRetries.delete(state.id);
            batchTimer = setTimeout(() => {
                isRunning = false;
                if (!isRunning)
                    runBatchedRemoteQuery();
                batchTimer = null;
            }, retryDelay);
            return;
        }
        if (!isConnected) {
            if (!calledOfflineRetries.has(state.id)) {
                log(`[Supastash] Not connected to internet\n` +
                    `  Table: ${state.table}\n` +
                    `  Method: ${state.method}\n` +
                    `  Retries: ${MAX_OFFLINE_RETRIES}\n`);
            }
            stateCache.unshift(state);
            calledOfflineRetries.set(state.id, (calledOfflineRetries.get(state.id) || 0) + 1);
            await delay(1000);
            continue;
        }
        calledOfflineRetries.delete(state.id);
        const retryCount = state.retryCount || 0;
        const { error } = await querySupabase({
            ...state,
            isSingle: state.isSingle,
        }, true);
        if (error) {
            if (retryCount < MAX_RETRIES) {
                state.retryCount = retryCount + 1;
                stateCache.unshift(state);
                await delay(100 * retryCount);
                continue;
            }
            else {
                console.error(`[Supastash] Remote sync failed on ${state.table} with ${state.method} after ${retryCount + 1} tries: ${error.message}`);
            }
        }
    }
    isRunning = false;
}
function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
let batchTimer = null;
function addToCache(state) {
    stateCache.push(state);
    if (batchTimer)
        clearTimeout(batchTimer);
    batchTimer = setTimeout(() => {
        runBatchedRemoteQuery();
    }, 1500);
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
