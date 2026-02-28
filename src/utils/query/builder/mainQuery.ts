import { getSupastashConfig } from "../../../core/config";
import { txStore } from "../../../store/tx";
import {
  CrudMethods,
  MethodReturnTypeMap,
  SupabaseQueryReturn,
  SupastashQuery,
  SupastashQueryResult,
  SyncMode,
} from "../../../types/query.types";
import { logWarn } from "../../logs";
import { refreshScreen } from "../../refreshScreenCalls";
import {
  assignInsertIds,
  getCommonError,
  runSyncStrategy,
  validatePayloadForSingleInsert,
} from "../helpers/mainQueryHelpers";
import { validateQuery } from "../helpers/queryValidator";

/**
 * Queries the database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function queryDb<
  T extends CrudMethods,
  U extends boolean,
  V extends boolean,
  R,
  Z
>(
  state: SupastashQuery<T, U, R> & { viewRemoteResult: V }
): Promise<SupastashQueryResult<T, U, V, Z>> {
  let localData: Z | Z[] | null | undefined = null;
  try {
    validateQuery(state);

    const { method, isSingle, viewRemoteResult, table, type } = state;

    validatePayloadForSingleInsert(method, isSingle, state.payload, table);
    const updatedPayload: R | R[] | null | undefined =
      method === "insert" ? assignInsertIds(state.payload) : state.payload;
    const cfg = getSupastashConfig();
    const syncMode =
      cfg.supastashMode === "ghost" ? "localOnly" : (state.type as SyncMode);
    const updatedState = {
      ...state,
      payload: updatedPayload,
      type: syncMode,
    } as SupastashQuery<T, U, R>;

    if (state.txId && ["localFirst"].includes(updatedState.type)) {
      txStore[state.txId].push(updatedState);
    }

    const {
      localResult,
      remoteResult,
    }: {
      localResult: MethodReturnTypeMap<U, Z>[T] | null;
      remoteResult: SupabaseQueryReturn<U, Z> | null;
    } = await runSyncStrategy<T, U, R, Z>(updatedState);

    const success = !localResult?.error && !remoteResult?.error;
    const commonError = getCommonError<U, T, R, Z>(
      table,
      method,
      localResult,
      remoteResult
    );

    if (viewRemoteResult) {
      return Promise.resolve({
        remote: remoteResult ?? null,
        local: localResult,
        success,
      }) as SupastashQueryResult<T, U, V, Z>;
    }

    if (method === "delete") {
      return Promise.resolve({
        error: commonError ?? null,
        success,
      }) as SupastashQueryResult<T, U, V, Z>;
    }

    const remoteData = remoteResult?.data;
    const localData = localResult?.data;
    const policy = state.fetchPolicy;
    const fetchPolicyData = !policy
      ? null
      : policy === "localFirst"
      ? localData ?? remoteData
      : remoteData ?? localData;

    const data =
      fetchPolicyData ??
      (type === "remoteOnly" ? remoteData : localData ?? null);

    return Promise.resolve({
      data,
      error: commonError ?? null,
      success,
    }) as SupastashQueryResult<T, U, V, Z>;
  } catch (error) {
    logWarn(
      `[Supastash] ${error instanceof Error ? error.message : String(error)}`
    );

    if (state.throwOnError) throw error;

    if (state.viewRemoteResult) {
      return Promise.resolve({
        remote: null,
        local: null,
        success: false,
      }) as SupastashQueryResult<T, U, V, Z>;
    }

    return Promise.resolve({
      data: null,
      error: { message: "Unknown error" },
      success: false,
    }) as SupastashQueryResult<T, U, V, Z>;
  } finally {
    if (state.method !== "select" && localData) {
      refreshScreen(state.table);
    }
  }
}
