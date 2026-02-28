import { getSupastashConfig } from "../../../core/config";
import { txStore } from "../../../store/tx";
import { logWarn } from "../../logs";
import { refreshScreen } from "../../refreshScreenCalls";
import { assignInsertIds, getCommonError, runSyncStrategy, validatePayloadForSingleInsert, } from "../helpers/mainQueryHelpers";
import { validateQuery } from "../helpers/queryValidator";
/**
 * Queries the database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function queryDb(state) {
    let localData = null;
    try {
        validateQuery(state);
        const { method, isSingle, viewRemoteResult, table, type } = state;
        validatePayloadForSingleInsert(method, isSingle, state.payload, table);
        const updatedPayload = method === "insert" ? assignInsertIds(state.payload) : state.payload;
        const cfg = getSupastashConfig();
        const syncMode = cfg.supastashMode === "ghost" ? "localOnly" : state.type;
        const updatedState = {
            ...state,
            payload: updatedPayload,
            type: syncMode,
        };
        if (state.txId && ["localFirst"].includes(updatedState.type)) {
            txStore[state.txId].push(updatedState);
        }
        const { localResult, remoteResult, } = await runSyncStrategy(updatedState);
        const success = !localResult?.error && !remoteResult?.error;
        const commonError = getCommonError(table, method, localResult, remoteResult);
        if (viewRemoteResult) {
            return Promise.resolve({
                remote: remoteResult ?? null,
                local: localResult,
                success,
            });
        }
        if (method === "delete") {
            return Promise.resolve({
                error: commonError ?? null,
                success,
            });
        }
        const remoteData = remoteResult?.data;
        const localData = localResult?.data;
        const policy = state.fetchPolicy;
        const fetchPolicyData = !policy
            ? null
            : policy === "localFirst"
                ? localData ?? remoteData
                : remoteData ?? localData;
        const data = fetchPolicyData ??
            (type === "remoteOnly" ? remoteData : localData ?? null);
        return Promise.resolve({
            data,
            error: commonError ?? null,
            success,
        });
    }
    catch (error) {
        logWarn(`[Supastash] ${error instanceof Error ? error.message : String(error)}`);
        if (state.throwOnError)
            throw error;
        if (state.viewRemoteResult) {
            return Promise.resolve({
                remote: null,
                local: null,
                success: false,
            });
        }
        return Promise.resolve({
            data: null,
            error: { message: "Unknown error" },
            success: false,
        });
    }
    finally {
        if (state.method !== "select" && localData) {
            refreshScreen(state.table);
        }
    }
}
