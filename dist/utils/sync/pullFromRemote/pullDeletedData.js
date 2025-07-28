import { getSupastashConfig } from "../../../core/config";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { getLastDeletedInfo, updateLastDeletedInfo, } from "./getLastDeletedInfo";
import isValidFilter from "./validateFilters";
let timesPulled = 0;
let lastPulled = 0;
/**
 * Pulls deleted data from the remote database for a given table
 * @param table - The table to pull deleted data from
 * @returns The deleted data from the table as a map of id to record and the reordered data
 */
export async function pullDeletedData(table, filters) {
    const lastDeletedAt = await getLastDeletedInfo(table);
    const supabase = getSupastashConfig().supabaseClient;
    if (!supabase)
        throw new Error(`No supabase client found: ${supabaseClientErr}`);
    let filteredQuery = supabase
        .from(table)
        .select("*")
        .gt("deleted_at", lastDeletedAt)
        .order("deleted_at", { ascending: false, nullsFirst: false });
    for (const filter of filters || []) {
        if (!isValidFilter([filter])) {
            throw new Error(`Invalid syncFilter: ${JSON.stringify(filter)} for table ${table}`);
        }
        filteredQuery = filteredQuery[filter.operator](filter.column, filter.value);
    }
    // Fetch records deleted after the last sync
    const { data, error } = await filteredQuery;
    if (error) {
        log(`[Supastash] Error fetching from ${table}:`, error.message);
        return null;
    }
    if (!data || data.length === 0) {
        timesPulled++;
        if (timesPulled >= 150) {
            const timeSinceLastPull = Date.now() - lastPulled;
            lastPulled = Date.now();
            log(`[Supastash] No deleted records for ${table} from ${lastDeletedAt} (times pulled: ${timesPulled}) in the last ${timeSinceLastPull}ms`);
            timesPulled = 0;
        }
        return null;
    }
    log(`Received ${data.length} deleted records for ${table}`);
    // Update the supastash_deleted_status table with the lastest timestamp
    const lastest = data.find((r) => r.deleted_at)?.deleted_at;
    await updateLastDeletedInfo(table, lastest);
    const deletedDataMap = new Map(data.map((d) => [d.id, d]));
    return { deletedDataMap, records: data };
}
