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
export function buildSelect(state) {
    return async () => await selectData({ ...state, select: state.select || "*" });
}
/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export function buildInsert(state) {
    const payload = state.payload;
    const newPayload = payload
        ? Array.isArray(payload)
            ? payload
            : [payload]
        : null;
    return async () => await insertData({ ...state, payload: newPayload });
}
/**
 * Builds an update query
 *
 * @returns query
 */
export function buildUpdate(state) {
    return async () => await updateData(state);
}
/**
 * Builds a delete query
 *
 * @returns query
 */
export function buildDelete(state) {
    return async () => await deleteData(state);
}
export function buildUpsert(state) {
    const payload = state.payload;
    const newPayload = payload
        ? Array.isArray(payload)
            ? payload
            : [payload]
        : null;
    return async () => await upsertData({ ...state, payload: newPayload });
}
