import { getSupaStashDb } from "@/db/dbInitializer";
import { FilterCalls, PayloadData, SupastashResult } from "@/types/query.types";
import { buildWhereClause } from "@/utils/query/remoteDb/queryFilterBuilder";
import { assertTableExists } from "@/utils/tableValidator";

/**
 * Selects one or many rows from the local database.
 *
 * @returns a data / error object
 */
export async function selectData<T extends boolean>(
  table: string,
  select: string,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: T
): Promise<
  T extends true ? SupastashResult<PayloadData> : SupastashResult<PayloadData[]>
> {
  if (!table) throw new Error("Table name was not provided for a select call");

  await assertTableExists(table);

  const { clause, values: filterValues } = buildWhereClause(filters ?? []);

  const limitClause = limit ? `LIMIT ${limit}` : "";

  const query = `SELECT ${select} FROM ${table} ${clause} ${limitClause}`;

  try {
    const db = await getSupaStashDb();

    let data: any;

    if (isSingle) {
      data = await db.getFirstAsync(query, filterValues);
    } else {
      data = await db.getAllAsync(query, filterValues);
    }

    return { data, error: null } as any;
  } catch (error) {
    console.error(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    } as any;
  }
}
