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
        const updatedState = {
            ...state,
            payload: updatedPayload,
        };
        const { localResult, remoteResult, } = await runSyncStrategy(updatedState);
        localData = localResult?.data;
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
        return Promise.resolve({
            data: type === "remoteOnly" ? remoteResult?.data : localData ?? null,
            error: commonError ?? null,
            success,
        });
    }
    catch (error) {
        logWarn(`[Supastash] ${error instanceof Error ? error.message : String(error)}`);
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
