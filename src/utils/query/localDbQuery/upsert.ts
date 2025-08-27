import {
  PayloadListResult,
  PayloadResult,
  SyncMode,
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
  table: string,
  payload: R | R[] | null,
  syncMode?: SyncMode,
  isSingle?: T,
  onConflictKeys: string[] = ["id"],
  preserveTimestamp?: boolean
): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>> {
  if (!payload || !table)
    throw new Error("Table and payload are required for upsert.");

  await assertTableExists(table);

  const items = Array.isArray(payload) ? payload : [payload];

  try {
    const upserted = await upsertMany<R>(items, {
      table,
      syncMode,
      returnRows: true,
      onConflictKeys,
      preserveTimestamp,
    });

    return {
      error: null,
      data: isSingle ? upserted?.[0] : upserted,
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
