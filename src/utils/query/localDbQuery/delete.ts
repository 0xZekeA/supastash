import { SupastashSQLiteExecutor } from "src/types/supastashConfig.types";
import { getSupastashDb } from "../../../db/dbInitializer";
import {
  CrudMethods,
  FilterCalls,
  SupastashQuery,
  SupatashDeleteResult,
} from "../../../types/query.types";
import { logError } from "../../logs";
import { assertTableExists } from "../../tableValidator";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";

/**
 * Soft delete: Sets `deleted_at` timestamp based on provided filters.
 * @param table - The name of the table to delete from
 * @param filters - The filters to apply to the delete query
 * @returns The result of the delete query
 */
export async function deleteData<Z = any>(
  state: SupastashQuery<CrudMethods, boolean, Z>
): Promise<SupatashDeleteResult<Z>> {
  const { table, filters, tx, type: syncMode } = state;
  await assertTableExists(table);

  const { clause, values: filterValues } = buildWhereClause(filters ?? []);

  try {
    const db = tx ?? (await getSupastashDb());
    const timeStamp = new Date().toISOString();

    const itemsToBeDeleted = await db.getAllAsync(
      `SELECT * FROM ${table} ${clause}`,
      filterValues
    );

    await db.runAsync(
      `UPDATE ${table} SET deleted_at = ?, updated_at = ?, synced_at = NULL ${clause}`,
      [timeStamp, timeStamp, ...filterValues]
    );

    if (syncMode === "localOnly" || syncMode === "remoteFirst") {
      await permanentlyDeleteData({
        table,
        filters,
        tx,
        throwOnError: state.throwOnError,
      });
    }
    return { error: null, data: itemsToBeDeleted } as SupatashDeleteResult<Z>;
  } catch (error) {
    logError(`[Supastash] ${error}`);
    if (state.throwOnError) throw error;
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    } as SupatashDeleteResult<Z>;
  }
}

/**
 * Hard delete: Permanently removes a row by its `id`.
 * @param table - The name of the table to delete from
 * @param id - The id of the row to delete
 * @returns The result of the delete query
 */
export async function permanentlyDeleteData<R = any>({
  table,
  filters,
  tx,
  throwOnError = true,
}: {
  table: string;
  filters: FilterCalls[] | null;
  tx: SupastashSQLiteExecutor | null;
  throwOnError?: boolean;
}): Promise<SupatashDeleteResult<R>> {
  await assertTableExists(table);

  try {
    const db = tx ?? (await getSupastashDb());
    const { clause, values: filterValues } = buildWhereClause(filters ?? []);

    await db.runAsync(`DELETE FROM ${table} ${clause}`, filterValues);

    return { error: null } as any;
  } catch (error) {
    logError(`[Supastash] ${error}`);
    if (throwOnError) throw error;
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    } as SupatashDeleteResult<R>;
  }
}
