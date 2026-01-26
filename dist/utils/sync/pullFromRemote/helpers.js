import { getSupastashConfig } from "../../../core/config";
import { RECEIVED_DATA_COMPLETED_MAP, RECEIVED_DATA_THRESHOLD, } from "../../../store/syncStatus";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import isValidFilter from "./validateFilters";
const RANDOM_OLD_DATE = "2000-01-01T00:00:00Z";
const PAGE_SIZE = RECEIVED_DATA_THRESHOLD;
const MAX_PAGE_SIZE = 2000;
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
    const lastWork = getReceivedDataCompleted({
        batchId: base.batchId,
        col: base.tsCol,
    });
    if (lastWork.completed)
        return results;
    let cursorTs = lastWork.lastTimestamp || base.since || RANDOM_OLD_DATE;
    let cursorId = lastWork.lastId || "";
    let lastDataSize = 0;
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
        if (data.length < PAGE_SIZE) {
            setReceivedDataCompleted({
                batchId: base.batchId,
                col: base.tsCol,
                completed: {
                    completed: true,
                    lastTimestamp: cursorTs,
                    lastId: cursorId,
                },
            });
            break;
        }
        const last = data[data.length - 1];
        cursorTs = last[base.tsCol];
        cursorId = last.id;
        lastDataSize += data.length;
        setReceivedDataCompleted({
            batchId: base.batchId,
            col: base.tsCol,
            completed: {
                completed: false,
                lastTimestamp: cursorTs,
                lastId: cursorId,
            },
        });
        if (lastDataSize >= MAX_PAGE_SIZE) {
            break;
        }
        await new Promise((res) => setTimeout(res, 0));
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
export function getReceivedDataCompleted({ batchId, col, }) {
    if (!batchId || !RECEIVED_DATA_COMPLETED_MAP[batchId]) {
        throw new Error(`Batch ${batchId} not found`);
    }
    const completed = RECEIVED_DATA_COMPLETED_MAP[batchId][col] ?? false;
    return completed;
}
export function setReceivedDataCompleted({ batchId, col, completed, }) {
    if (!batchId || !RECEIVED_DATA_COMPLETED_MAP[batchId]) {
        throw new Error(`Batch ${batchId} not found`);
    }
    RECEIVED_DATA_COMPLETED_MAP[batchId][col] = completed;
}
export function deleteReceivedDataCompleted(batchId) {
    delete RECEIVED_DATA_COMPLETED_MAP[batchId];
}
