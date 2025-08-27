import {
  PayloadListResult,
  PayloadResult,
  SyncMode,
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
  table: string,
  payload: R[] | null,
  syncMode?: SyncMode,
  isSingle?: T
): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>> {
  if (!table) throw new Error("Table name was not provided for an insert call");

  if (!payload)
    throw new Error(
      `Payload data was not provided for an insert call on ${table}`
    );

  try {
    await assertTableExists(table);

    const inserted = await insertMany<R>(payload, {
      table,
      syncMode,
      returnInsertedRows: true,
    });

    return {
      error: null,
      data: isSingle ? inserted?.[0] : inserted,
    } as T extends true ? PayloadResult<Z> : PayloadListResult<Z>;
  } catch (error) {
    logError(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    } as T extends true ? PayloadResult<Z> : PayloadListResult<Z>;
  }
}
