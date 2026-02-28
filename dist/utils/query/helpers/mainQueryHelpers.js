import { logWarn } from "../../../utils/logs";
import { generateUUIDv4 } from "../../genUUID";
import { queryLocalDb } from "../localDbQuery";
import { querySupabase } from "../remoteQuery/supabaseQuery";
import { queueRemoteCall } from "./queueRemote";
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
async function handleSelect(state) {
    let localResult = null;
    let remoteResult = null;
    const isEmpty = (result) => result?.error ||
        !result?.data ||
        (Array.isArray(result.data) && result.data.length === 0);
    if (state.fetchPolicy === "localFirst") {
        localResult = await queryLocalDb(state);
        if (isEmpty(localResult)) {
            remoteResult = await querySupabase(state);
        }
        return { localResult, remoteResult };
    }
    if (state.fetchPolicy === "remoteFirst") {
        remoteResult = await querySupabase(state);
        if (isEmpty(remoteResult)) {
            localResult = await queryLocalDb(state);
            return { localResult, remoteResult: null };
        }
        return { localResult: null, remoteResult };
    }
    if (state.type === "remoteFirst") {
        remoteResult = await querySupabase(state);
        localResult = await queryLocalDb(state);
        return { localResult, remoteResult };
    }
    if (state.type === "remoteOnly") {
        remoteResult = await querySupabase(state);
        return { localResult, remoteResult: null };
    }
    localResult = await queryLocalDb(state);
    return { localResult, remoteResult };
}
export async function runSyncStrategy(state) {
    const { type } = state;
    let localResult = null;
    let remoteResult = null;
    if (state.method === "select") {
        return await handleSelect(state);
    }
    const isUpsert = state.method === "upsert";
    switch (type) {
        case "localOnly":
            localResult = await queryLocalDb(state);
            break;
        case "remoteOnly":
            remoteResult = await querySupabase(state);
            break;
        case "localFirst":
            localResult = await queryLocalDb(state);
            // If we are in a transaction, we don't want to queue a remote call
            // Remote calls are handled write after the transaction is committed
            if (state.txId)
                return { localResult, remoteResult: null };
            if (state.viewRemoteResult) {
                if (isUpsert) {
                    logWarn("Cannot view remote result for upserts. Data will still be synced.");
                    queueRemoteCall(state);
                    return { localResult, remoteResult: null };
                }
                remoteResult = await querySupabase(state);
            }
            else {
                if (!isUpsert) {
                    queueRemoteCall(state);
                }
            }
            break;
        case "remoteFirst":
            remoteResult = await querySupabase(state);
            if (remoteResult?.error) {
                return { localResult: null, remoteResult };
            }
            if (!remoteResult)
                return { localResult, remoteResult };
            const remoteRows = Array.isArray(remoteResult.data)
                ? remoteResult.data
                : remoteResult.data
                    ? [remoteResult.data]
                    : [];
            if (remoteRows.length > 0 && isUpsert) {
                const newState = {
                    ...state,
                    payload: remoteRows,
                };
                localResult = await queryLocalDb(newState);
            }
            else {
                localResult = await queryLocalDb(state);
            }
            break;
        default:
            throw new Error(`Unknown sync mode: ${type}`);
    }
    return { localResult, remoteResult };
}
