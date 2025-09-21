import { getSupastashDb } from "../../../db/dbInitializer";
import { logError } from "../../logs";
import { assertTableExists } from "../../tableValidator";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";
/**
 * Soft delete: Sets `deleted_at` timestamp based on provided filters.
 * @param table - The name of the table to delete from
 * @param filters - The filters to apply to the delete query
 * @returns The result of the delete query
 */
export async function deleteData(table, filters, syncMode) {
    await assertTableExists(table);
    const { clause, values: filterValues } = buildWhereClause(filters ?? []);
    try {
        const db = await getSupastashDb();
        const timeStamp = new Date().toISOString();
        const itemsToBeDeleted = await db.getAllAsync(`SELECT * FROM ${table} ${clause}`, filterValues);
        await db.runAsync(`UPDATE ${table} SET deleted_at = ?, synced_at = NULL ${clause}`, [timeStamp, ...filterValues]);
        if (syncMode === "localOnly" || syncMode === "remoteFirst") {
            permanentlyDeleteData(table, filters);
        }
        return { error: null, data: itemsToBeDeleted };
    }
    catch (error) {
        logError(`[Supastash] ${error}`);
        return {
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
        };
    }
}
/**
 * Hard delete: Permanently removes a row by its `id`.
 * @param table - The name of the table to delete from
 * @param id - The id of the row to delete
 * @returns The result of the delete query
 */
export async function permanentlyDeleteData(table, filters) {
    await assertTableExists(table);
    try {
        const db = await getSupastashDb();
        const { clause, values: filterValues } = buildWhereClause(filters ?? []);
        await db.runAsync(`DELETE FROM ${table} ${clause}`, filterValues);
        return { error: null };
    }
    catch (error) {
        logError(`[Supastash] ${error}`);
        return {
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
        };
    }
}
