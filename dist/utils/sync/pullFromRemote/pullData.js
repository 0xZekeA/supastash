import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import log, { logWarn } from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { selectAndAddAMillisecond } from "../status/repo";
import { setSupastashSyncStatus } from "../status/services";
import { getMaxDate, logNoUpdates, pageThrough } from "./helpers";
/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export async function pullData(table, filters) {
    const supabase = getSupastashConfig().supabaseClient;
    if (!supabase)
        throw new Error(`No supabase client found: ${supabaseClientErr}`);
    const db = await getSupastashDb();
    const { last_created_at, last_synced_at, last_deleted_at } = await selectAndAddAMillisecond(db, table, filters);
    const [createdRows, updatedRows, deletedRows] = await Promise.all([
        pageThrough({
            tsCol: "created_at",
            since: last_created_at,
            table,
            filters,
        }),
        pageThrough({ tsCol: "updated_at", since: last_synced_at, table, filters }),
        pageThrough({
            tsCol: "deleted_at",
            since: last_deleted_at,
            includeDeleted: true,
            select: "id, deleted_at",
            table,
            filters,
        }),
    ]);
    const merged = {};
    for (const r of [...createdRows, ...updatedRows]) {
        if (!r?.id) {
            logWarn(`[Supastash] Skipped row without id from "${table}"`);
            continue;
        }
        merged[r.id] = r;
    }
    const data = Object.values(merged);
    if (data.length === 0) {
        logNoUpdates(table);
        return null;
    }
    const deletedIds = deletedRows.map((r) => r.id);
    const createdMax = getMaxDate(createdRows, "created_at");
    const updatedMax = getMaxDate(updatedRows, "updated_at");
    const deletedMax = getMaxDate(deletedRows, "deleted_at");
    log(`Received ${data.length} updates for ${table}`);
    await setSupastashSyncStatus(table, filters, {
        lastCreatedAt: createdMax,
        lastSyncedAt: updatedMax,
        lastDeletedAt: deletedMax,
        filterNamespace: "global",
    });
    log(`[Supastash] Received ${data.length} updates for ${table} (c${createdRows.length}/u${updatedRows.length}/d${deletedRows.length})`);
    return { data, deletedIds };
}
