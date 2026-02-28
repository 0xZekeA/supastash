import { buildDelete, buildInsert, buildSelect, buildUpdate, buildUpsert, } from "./localQueryBuilder";
/**
 * Gets method for local db calls
 *
 * @param table - The name of the table to query
 * @param method - The method to call
 * @param select - The columns to select
 * @param payload - The payload to insert
 * @param filters - The filters to apply
 * @param limit - The limit to apply
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns query
 */
export default function getLocalMethod(state) {
    const { method } = state;
    const handlers = {
        select: buildSelect(state),
        insert: buildInsert(state),
        update: buildUpdate(state),
        delete: buildDelete(state),
        upsert: buildUpsert(state),
        none: async () => null,
    };
    return handlers[method];
}
