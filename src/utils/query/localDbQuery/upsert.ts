import {
  CrudMethods,
  PayloadListResult,
  PayloadResult,
  SupastashQuery,
} from "../../../types/query.types";
import { logError } from "../../logs";
import { assertTableExists } from "../../tableValidator";
import { upsertMany } from "../helpers/localDb/upsertMany";

const warned = new Set<string>();

/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export async function upsertData<T extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, boolean, R>
): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>> {
  const {
    table,
    payload,
    type: syncMode,
    isSingle,
    onConflictKeys,
    preserveTimestamp,
  } = state;
  if (!payload)
    throw new Error(
      `[Supastash] Payload data was not provided for an upsert call on ${table}`
    );

  await assertTableExists(table);

  const items = Array.isArray(payload) ? payload : [payload];

  try {
    const upserted = await upsertMany<R>(
      items,
      {
        table,
        syncMode,
        returnRows: true,
        onConflictKeys,
        preserveTimestamp,
        withTx: state.withTx,
        tx: state.tx,
      },
      state
    );

    return {
      error: null,
      data: isSingle ? upserted?.[0] : upserted,
    } as T extends true ? PayloadResult<Z> : PayloadListResult<Z>;
  } catch (error) {
    logError(`[Supastash] ${error}`);
    if (state.throwOnError) throw error;
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    } as T extends true ? PayloadResult<Z> : PayloadListResult<Z>;
  }
}
