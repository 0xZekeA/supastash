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
export default function getLocalMethod(table, method, select, payload, filters, limit, isSingle, onConflictKeys, syncMode, preserveTimestamp) {
    const handlers = {
        select: buildSelect(table, select, filters, limit, isSingle),
        insert: buildInsert(table, payload, syncMode, isSingle),
        update: buildUpdate(table, payload, filters, syncMode, isSingle, preserveTimestamp),
        delete: buildDelete(table, filters, syncMode),
        upsert: buildUpsert(table, payload, syncMode, isSingle, onConflictKeys, preserveTimestamp),
        none: async () => null,
    };
    return handlers[method];
}
