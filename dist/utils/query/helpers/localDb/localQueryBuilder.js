import { deleteData } from "../../localDbQuery/delete";
import { insertData } from "../../localDbQuery/insert";
import { selectData } from "../../localDbQuery/select";
import { updateData } from "../../localDbQuery/update";
import { upsertData } from "../../localDbQuery/upsert";
/**
 * Builds a select query
 *
 * @param table - The name of the table to query
 * @param select - The columns to select
 * @param filters - The filters to apply
 * @param limit - The limit to apply
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns query
 */
export function buildSelect(table, select, filters, limit, isSingle) {
    return async () => await selectData(table, select || "*", filters, limit, isSingle);
}
/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export function buildInsert(table, payload, syncMode, isSingle) {
    const newPayload = payload
        ? Array.isArray(payload)
            ? payload
            : [payload]
        : null;
    return async () => await insertData(table, newPayload, syncMode, isSingle);
}
/**
 * Builds an update query
 *
 * @returns query
 */
export function buildUpdate(table, payload, filters, syncMode) {
    return async () => await updateData(table, payload, filters, syncMode);
}
/**
 * Builds a delete query
 *
 * @returns query
 */
export function buildDelete(table, filters, syncMode) {
    return async () => await deleteData(table, filters, syncMode);
}
export function buildUpsert(table, payload, syncMode, isSingle) {
    return async () => await upsertData(table, payload, syncMode, isSingle);
}
