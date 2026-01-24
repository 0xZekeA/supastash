import { getSupastashConfig } from "../../../core/config";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import isValidFilter from "./validateFilters";
const RANDOM_OLD_DATE = "2000-01-01T00:00:00Z";
const PAGE_SIZE = 1000;
const timesPulled = new Map();
const lastPulled = new Map();
const DEFAULT_MAX_PULL_ATTEMPTS = 150;
function applyFilters(q, filters, table) {
    for (const f of filters) {
        if (!isValidFilter([f])) {
            throw new Error(`Invalid syncFilter: ${JSON.stringify(f)} for ${table}`);
        }
        q = q[f.operator](f.column, f.value);
    }
    return q;
}
export async function pageThrough(base) {
    const supabase = getSupastashConfig().supabaseClient;
    if (!supabase)
        throw new Error(`No supabase client found: ${supabaseClientErr}`);
    const results = [];
    let cursorTs = base.since || RANDOM_OLD_DATE;
    let cursorId = "";
    const { table, filters = [], select = "*" } = base;
    while (true) {
        let q = supabase
            .from(table)
            .select(select)
            .order(base.tsCol, { ascending: true })
            .order("id", { ascending: true })
            .limit(PAGE_SIZE);
        if (cursorId) {
            q = q.or(`${base.tsCol}.gt.${cursorTs},and(${base.tsCol}.eq.${cursorTs},id.gt.${cursorId})`);
        }
        else {
            q = q.gte(base.tsCol, cursorTs);
        }
        if (!base.includeDeleted)
            q = q.is("deleted_at", null);
        if (filters) {
            q = applyFilters(q, filters, table);
        }
        const { data, error } = await q;
        if (error)
            throw error;
        if (!data || data.length === 0)
            break;
        results.push(...data);
        if (data.length < PAGE_SIZE)
            break;
        const last = data[data.length - 1];
        cursorTs = last[base.tsCol];
        cursorId = last.id;
    }
    return results;
}
export function getMaxDate(rows, col) {
    if (!rows?.length)
        return null;
    let max = RANDOM_OLD_DATE;
    for (const r of rows) {
        const v = r[col];
        if (typeof v === "string" && !isNaN(Date.parse(v))) {
            if (Date.parse(v) > Date.parse(max))
                max = new Date(v).toISOString();
        }
    }
    return max === RANDOM_OLD_DATE ? null : max;
}
export function logNoUpdates(table) {
    const pulled = timesPulled.get(table) || 0;
    const last = lastPulled.get(table) || 0;
    timesPulled.set(table, pulled + 1);
    if (pulled >= DEFAULT_MAX_PULL_ATTEMPTS) {
        const timeSinceLastPull = Date.now() - last;
        lastPulled.set(table, Date.now());
        log(`[Supastash] No updates for ${table} from ${last} (times pulled: ${pulled}) in the last ${timeSinceLastPull / 1000}s`);
        timesPulled.set(table, 0);
    }
}
