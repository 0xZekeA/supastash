import {
  CrudMethods,
  MethodReturnTypeMap,
  SupabaseQueryReturn,
  SupastashQuery,
  SupastashQueryResult,
} from "../../../types/query.types";
import { supastashEventBus } from "../../events/eventBus";
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
  R
>(
  state: SupastashQuery<T, U, R> & { viewRemoteResult: V }
): Promise<SupastashQueryResult<T, U, V, R>> {
  let localData: R | R[] | null | undefined = null;
  try {
    validateQuery(state);

    const { method, isSingle, viewRemoteResult, table } = state;

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
      localResult: MethodReturnTypeMap<U, R>[T] | null;
      remoteResult: SupabaseQueryReturn<U, R> | null;
    } = await runSyncStrategy<T, U, R>(updatedState);

    localData = localResult?.data;
    const success = !localResult?.error && !remoteResult?.error;
    const commonError = getCommonError<U, T, R>(
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
      }) as SupastashQueryResult<T, U, V, R>;
    }

    if (method === "delete") {
      return Promise.resolve({
        error: commonError ?? null,
        success,
      }) as SupastashQueryResult<T, U, V, R>;
    }

    return Promise.resolve({
      data: localData ?? null,
      error: commonError ?? null,
      success,
    }) as SupastashQueryResult<T, U, V, R>;
  } catch (error) {
    console.error(
      `[Supastash] ${error instanceof Error ? error.message : String(error)}`
    );

    if (state.viewRemoteResult) {
      return Promise.resolve({
        remote: null,
        local: null,
        success: false,
      }) as SupastashQueryResult<T, U, V, R>;
    }

    return Promise.resolve({
      data: null,
      error: { message: "Unknown error" },
      success: false,
    }) as SupastashQueryResult<T, U, V, R>;
  } finally {
    if (state.method !== "select" && localData) {
      supastashEventBus.emit(`push:${state.table}`, localData, state.method);
    }
  }
}
