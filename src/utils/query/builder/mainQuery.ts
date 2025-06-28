import {
  CrudMethods,
  MethodReturnTypeMap,
  SupabaseQueryReturn,
  SupastashQuery,
  SupastashQueryResult,
} from "../../../types/query.types";
import { logError } from "../../logs";
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
    const updatedState = {
      ...state,
      payload: updatedPayload,
    } as SupastashQuery<T, U, R>;

    const {
      localResult,
      remoteResult,
    }: {
      localResult: MethodReturnTypeMap<U, Z>[T] | null;
      remoteResult: SupabaseQueryReturn<U, Z> | null;
    } = await runSyncStrategy<T, U, R, Z>(updatedState);

    localData = localResult?.data;
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

    return Promise.resolve({
      data: type === "remoteOnly" ? remoteResult?.data : localData ?? null,
      error: commonError ?? null,
      success,
    }) as SupastashQueryResult<T, U, V, Z>;
  } catch (error) {
    logError(
      `[Supastash] ${error instanceof Error ? error.message : String(error)}`
    );

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
