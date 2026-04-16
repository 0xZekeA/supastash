import {
  CrudMethods,
  PayloadListResult,
  PayloadResult,
  SupastashQuery,
} from "../../../types/query.types";
import { logError } from "../../logs";
import { assertTableExists } from "../../tableValidator";
import { insertMany } from "../helpers/localDb/insertMany";

/**
 * Inserts data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns a data / error object
 */
export async function insertData<T extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, boolean, R>
): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>> {
  const {
    table,
    tx,
    type: syncMode,
    isSingle,
    withTx,
    payload,
  } = state as SupastashQuery<CrudMethods, boolean, R> & { payload: R[] };

  try {
    if (!payload)
      throw new Error(
        `[Supastash] Payload data was not provided for an insert call on ${table}`
      );
    await assertTableExists(table);

    const inserted = await insertMany<R>(payload, {
      table,
      syncMode,
      returnInsertedRows: true,
      withTx: withTx,
      tx,
    });

    return {
      error: null,
      data: isSingle ? inserted?.[0] : inserted,
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
