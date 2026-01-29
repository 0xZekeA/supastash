import { getSupastashDb } from "../../../db/dbInitializer";
import { tableFilters } from "../../../store/tableFilters";
import { logError, logWarn } from "../../logs";
import { canonicalizeFilters, computeFilterKey } from "./filterKey";
import { deleteMarks, ensureSyncMarksTable, resetColumn, selectMarks, upsertMarks, } from "./repo";
const maxIso = (a, b) => {
    if (!a)
        return b ?? null;
    if (!b)
        return a ?? null;
    return Date.parse(b) > Date.parse(a) ? b : a;
};
const OLD_DATE = "2000-01-01T00:00:00Z";
/**
 * Gets the supastash sync status for a given table and filters
 * @param table - The name of the table to get the sync status for
 * @param filters - The filters to apply to the sync status
 * @returns The supastash sync status
 */
export async function getSupastashSyncStatus(table, filters) {
    try {
        const filterToUse = filters ?? tableFilters.get(table) ?? [];
        const db = await getSupastashDb();
        await ensureSyncMarksTable();
        const fk = await computeFilterKey(filterToUse);
        return await selectMarks(db, table, fk);
    }
    catch (e) {
        logError(`[Supastash] getMarks(${table}) failed`, e);
        return null;
    }
}
export async function setSupastashSyncStatus(table, filters, opts) {
    try {
        const db = await getSupastashDb();
        await ensureSyncMarksTable();
        const filterToUse = filters ?? tableFilters.get(table) ?? [];
        const ns = opts.filterNamespace ?? "global";
        const fk = await computeFilterKey(filterToUse, ns);
        const filterJson = canonicalizeFilters(filterToUse);
        const existing = await selectMarks(db, table, fk);
        const nextLastCreated = opts.lastCreatedAt !== undefined
            ? maxIso(opts.lastCreatedAt, existing?.last_created_at ?? null)
            : existing?.last_created_at ?? null;
        const nextLastSynced = opts.lastSyncedAt !== undefined
            ? maxIso(opts.lastSyncedAt, existing?.last_synced_at ?? null)
            : existing?.last_synced_at ?? null;
        const nextLastDeleted = opts.lastDeletedAt !== undefined
            ? maxIso(opts.lastDeletedAt, existing?.last_deleted_at ?? null)
            : existing?.last_deleted_at ?? null;
        await upsertMarks(db, {
            table_name: table,
            filter_key: fk,
            filter_json: filterJson,
            last_synced_at_pk: opts.lastSyncedAtPk ?? undefined,
            last_created_at: nextLastCreated ?? undefined,
            last_synced_at: nextLastSynced ?? undefined,
            last_deleted_at: nextLastDeleted ?? undefined,
        });
        if (!opts.lastCreatedAt && !opts.lastSyncedAt && !opts.lastDeletedAt) {
            logWarn(`[Supastash] setSupastashSyncStatus(${table}): no fields provided`);
        }
    }
    catch (e) {
        logError(`[Supastash] setSupastashSyncStatus(${table}) failed`, e);
    }
}
/**
 * Resets the supastash sync status for a given table and filters
 * @param table - The name of the table to reset the sync status for
 * @param filters - The filters to apply to the sync status
 * @param scope - The scope to reset the sync status for
 * @returns The supastash sync status
 */
export async function resetSupastashSyncStatus(table, filters, scope = "all") {
    try {
        const db = await getSupastashDb();
        await ensureSyncMarksTable();
        const filterToUse = filters ?? tableFilters.get(table) ?? [];
        const fk = await computeFilterKey(filterToUse);
        const filterJson = canonicalizeFilters(filterToUse);
        if (scope === "all") {
            await resetColumn(db, table, fk, "last_synced_at", OLD_DATE, filterJson);
            await resetColumn(db, table, fk, "last_created_at", OLD_DATE, filterJson);
            await resetColumn(db, table, fk, "last_deleted_at", OLD_DATE, filterJson);
        }
        else {
            await resetColumn(db, table, fk, scope, OLD_DATE, filterJson);
        }
    }
    catch (e) {
        logError(`[Supastash] resetMarks(${table}, ${scope}) failed`, e);
    }
}
/**
 * Clears the supastash sync status for a given table and filters
 * @param table - The name of the table to clear the sync status for
 * @param filters - The filters to apply to the sync status
 * @returns The supastash sync status
 */
export async function clearSupastashSyncStatus(table, filters) {
    try {
        const filterToUse = filters ?? tableFilters.get(table) ?? [];
        const db = await getSupastashDb();
        await ensureSyncMarksTable();
        const fk = filterToUse ? await computeFilterKey(filterToUse) : undefined;
        await deleteMarks(db, table, fk);
    }
    catch (e) {
        logError(`[Supastash] clearMarks(${table}) failed`, e);
    }
}
