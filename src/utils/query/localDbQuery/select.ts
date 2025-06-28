import { getSupastashDb } from "../../../db/dbInitializer";
import {
  FilterCalls,
  PayloadListResult,
  PayloadResult,
} from "../../../types/query.types";
import { logError } from "../../logs";
import { parseStringifiedFields } from "../../sync/pushLocal/parseFields";
import { assertTableExists } from "../../tableValidator";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";

/**
 * Selects one or many rows from the local database.
 *
 * @param table - The name of the table to select from
 * @param select - The columns to select
 * @param filters - The filters to apply to the select query
 * @param limit - The limit to apply to the select query
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns a data / error object
 */
export async function selectData<T extends boolean, R, Z>(
  table: string,
  select: string,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: T
): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>> {
  if (!table) throw new Error("Table name was not provided for a select call");

  await assertTableExists(table);

  const { clause, values: filterValues } = buildWhereClause(filters ?? []);

  const limitClause = limit ? `LIMIT ${limit}` : "";

  const query = `SELECT ${select} FROM ${table} ${clause} ${limitClause}`;

  try {
    const db = await getSupastashDb();

    let data: any;

    if (isSingle) {
      const result = await db.getFirstAsync(query, filterValues);
      data = result ? parseStringifiedFields(result) : null;
    } else {
      const result = await db.getAllAsync(query, filterValues);
      data = Array.isArray(result) ? result.map(parseStringifiedFields) : [];
    }

    return { data, error: null } as T extends true
      ? PayloadResult<Z>
      : PayloadListResult<Z>;
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
