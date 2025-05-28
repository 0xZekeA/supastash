import { getSupaStashDb } from "@/db/dbInitializer";
import { FilterCalls, SupatashDeleteResult } from "@/types/query.types";
import { buildWhereClause } from "@/utils/query/remoteDb/queryFilterBuilder";
import { assertTableExists } from "@/utils/tableValidator";

/**
 * Soft delete: Sets `deleted_at` timestamp based on provided filters.
 * @param table - The name of the table to delete from
 * @param filters - The filters to apply to the delete query
 * @returns The result of the delete query
 */
export async function deleteData(
  table: string,
  filters: FilterCalls[] | null
): Promise<SupatashDeleteResult> {
  await assertTableExists(table);

  const { clause, values: filterValues } = buildWhereClause(filters ?? []);

  try {
    const db = await getSupaStashDb();
    const timeStamp = new Date().toISOString();

    await db.runAsync(
      `UPDATE ${table} SET deleted_at = ? synced_at = ? ${clause}`,
      [timeStamp, timeStamp, ...filterValues]
    );

    return { error: null } as any;
  } catch (error) {
    console.error(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    } as any;
  }
}

/**
 * Hard delete: Permanently removes a row by its `id`.
 * @param table - The name of the table to delete from
 * @param id - The id of the row to delete
 * @returns The result of the delete query
 */
export async function permanentlyDeleteData(
  table: string,
  filters: FilterCalls[] | null
): Promise<SupatashDeleteResult> {
  await assertTableExists(table);

  try {
    const db = await getSupaStashDb();
    const { clause, values: filterValues } = buildWhereClause(filters ?? []);

    await db.runAsync(`DELETE FROM ${table} ${clause}`, filterValues);

    return { error: null } as any;
  } catch (error) {
    console.error(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    } as any;
  }
}
