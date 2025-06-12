import { getSupastashDb } from "../../../db/dbInitializer";
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
export async function selectData(table, select, filters, limit, isSingle) {
    if (!table)
        throw new Error("Table name was not provided for a select call");
    await assertTableExists(table);
    const { clause, values: filterValues } = buildWhereClause(filters ?? []);
    const limitClause = limit ? `LIMIT ${limit}` : "";
    const query = `SELECT ${select} FROM ${table} ${clause} ${limitClause}`;
    try {
        const db = await getSupastashDb();
        let data;
        if (isSingle) {
            data = await db.getFirstAsync(query, filterValues);
        }
        else {
            data = await db.getAllAsync(query, filterValues);
        }
        return { data, error: null };
    }
    catch (error) {
        console.error(`[Supastash] ${error}`);
        return {
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
            data: null,
        };
    }
}
