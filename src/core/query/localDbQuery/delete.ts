import { getSupaStashDb } from "@/db/dbInitializer";
import { FilterCalls, SupatashDeleteResult } from "@/types/query.types";
import { buildWhereClause } from "@/utils/query/remoteDb/queryFilterBuilder";
import { assertTableExists } from "@/utils/tableValidator";

/**
 * Soft delete: Sets `deleted_at` timestamp based on provided filters.
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
 */
export async function permanentlyDeleteItem(
  table: string,
  id: string
): Promise<SupatashDeleteResult> {
  await assertTableExists(table);

  try {
    const db = await getSupaStashDb();

    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);

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
