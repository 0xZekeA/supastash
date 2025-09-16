import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { supastashEventBus } from "../../../utils/events/eventBus";
import log, { logWarn } from "../../../utils/logs";
import { setQueryStatus } from "../queryStatus";
import { updateLocalSyncedAt } from "../status/syncUpdate";
const DEFAULT_REWIND_MS = 60 * 60 * 1000; // 1 hour
const MAX_REWIND_BACKSTOP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export function classifyFailure(cfg, code) {
    const p = cfg.syncPolicy ?? {};
    const n = Number(code);
    if (n === 409 || n === 412)
        return "HTTP";
    if (code == null)
        return "UNKNOWN";
    const s = String(code);
    if (p.nonRetryableCodes?.has?.(s))
        return "NON_RETRYABLE";
    if (s === (p.fkCode ?? "23503"))
        return "FK_BLOCK";
    if (p.retryableCodes?.has?.(s))
        return "RETRYABLE";
    return "UNKNOWN";
}
async function batchUpsert(table, rows, supabase) {
    return await supabase.from(table).upsert(rows);
}
async function singleUpsert(table, row, supabase) {
    return await supabase.from(table).upsert(row).select("id").maybeSingle();
}
async function fetchServerRowById(table, id, supabase) {
    const { data } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
    return data ?? null;
}
/* ────────────────────────────────────────────────────────────────────────── *
 * Local side-effects (shared)
 * ────────────────────────────────────────────────────────────────────────── */
async function markSynced(table, ids) {
    await updateLocalSyncedAt(table, ids);
    for (const id of ids)
        setQueryStatus(id, table, "success");
    supastashEventBus.emit("updateSyncStatus");
}
async function acceptServerAndStopRetrying(table, id) {
    await updateLocalSyncedAt(table, [id]);
    setQueryStatus(id, table, "success");
}
/* ────────────────────────────────────────────────────────────────────────── *
 * Pre-filter: decide which local rows are worth pushing (server-wins on time)
 * ────────────────────────────────────────────────────────────────────────── */
function filterRowsByUpdatedAt(table, chunk, remoteHeads) {
    const toPush = [];
    const cfg = getSupastashConfig();
    const defaultDate = cfg.fieldEnforcement?.autoFillDefaultISO ?? "1970-01-01T00:00:00Z";
    for (const row of chunk) {
        const id = row?.id;
        const updatedAt = row?.updated_at ?? defaultDate;
        if (!id || !updatedAt) {
            // Skip bad input silently but mark visible status for debugging.
            setQueryStatus(id ?? "UNKNOWN", table, "error");
            continue;
        }
        const remoteUpdatedAt = remoteHeads.get(id) ?? defaultDate;
        const localTs = new Date(updatedAt);
        const remoteTs = new Date(remoteUpdatedAt);
        if (remoteTs > localTs) {
            // Server newer -> accept server; stop retrying this row
            void acceptServerAndStopRetrying(table, id);
            continue;
        }
        setQueryStatus(id, table, "pending");
        toPush.push(row);
    }
    return toPush;
}
/* ────────────────────────────────────────────────────────────────────────── *
 * Per-row conflict handling
 * ────────────────────────────────────────────────────────────────────────── */
async function handleRowFailure(cfg, table, row, err, supabase) {
    const code = (err?.code ?? err?.status);
    const klass = classifyFailure(cfg, code);
    if (klass === "NON_RETRYABLE") {
        const action = cfg.syncPolicy?.onNonRetryable ?? "accept-server";
        if (action === "delete-local" || cfg.deleteConflictedRows) {
            logWarn(`Row ${row.id} on ${table} hit NON_RETRYABLE conflict → deleting local`, JSON.stringify(err));
            await deleteLocalRow(table, row.id);
            cfg.syncPolicy?.onRowDroppedLocal?.(table, row.id);
            return "DROP";
        }
        else {
            logWarn(`Row ${row.id} on ${table} hit NON_RETRYABLE conflict → accepting server`, JSON.stringify(err));
            await acceptServerAndStopRetrying(table, row.id);
            cfg.syncPolicy?.onRowAcceptedServer?.(table, row.id);
            return "DROP";
        }
    }
    if (klass === "FK_BLOCK") {
        // Parent missing (23503) -> KEEP for later;
        log(`Row ${row.id} on ${table} blocked by missing parent (FK) → will retry`, JSON.stringify(err));
        setQueryStatus(row.id, table, "error");
        return "KEEP";
    }
    if (klass === "HTTP" || klass === "RETRYABLE" || klass === "UNKNOWN") {
        log(`Row ${row.id} on ${table} transient/HTTP error → scheduling retry`, JSON.stringify(err));
        if (klass === "HTTP") {
            const server = await fetchServerRowById(table, row.id, supabase);
            if (server) {
                await replaceLocalWithServer(table, server);
                return "REPLACED";
            }
            else if (cfg.deleteConflictedRows) {
                await deleteLocalRow(table, row.id);
                cfg.syncPolicy?.onRowDroppedLocal?.(table, row.id);
                return "REPLACED";
            }
        }
        setQueryStatus(row.id, table, "error");
        return "KEEP";
    }
    setQueryStatus(row.id, table, "error");
    return "KEEP";
}
function quoteIdent(name) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`[Supastash] Invalid table identifier: ${name}`);
    }
    return `"${name.replace(/"/g, '""')}"`;
}
async function deleteLocalRow(table, id) {
    await rewindAndDropLocal(table, id);
    setQueryStatus(id, table, "success");
    supastashEventBus.emit("updateSyncStatus");
}
export { batchUpsert, filterRowsByUpdatedAt, handleRowFailure, markSynced, singleUpsert, };
/**
 * Deletes local row and rewinds table watermark so normal pull will fetch server copy.
 * No server read needed.
 */
export async function rewindAndDropLocal(table, rowId) {
    const db = await getSupastashDb();
    // 1) Delete local copy
    await db.runAsync(`DELETE FROM ${quoteIdent(table)} WHERE id = ?`, [rowId]);
    logWarn(`[Supastash] REPLACED: dropped local ${table}:${rowId}
    `);
}
async function replaceLocalWithServer(table, serverRow) {
    const db = await getSupastashDb();
    const cols = Object.keys(serverRow);
    const placeholders = cols.map(() => "?").join(", ");
    const updates = cols
        .filter((c) => c !== "id")
        .map((c) => `${c}=excluded.${c}`)
        .join(", ");
    await db.runAsync(`INSERT INTO ${quoteIdent(table)} (${cols.join(",")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates};`, cols.map((c) => serverRow[c] ?? null));
    await updateLocalSyncedAt(table, [serverRow.id]);
    setQueryStatus(serverRow.id, table, "success");
    supastashEventBus.emit("updateSyncStatus");
}
export async function fetchRemoteHeadsChunked(table, ids, supabase) {
    const CHUNK = 1000;
    const map = new Map();
    for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        const { data, error } = await supabase
            .from(table)
            .select("id,updated_at")
            .in("id", slice);
        if (error)
            throw error;
        for (const r of data ?? [])
            map.set(r.id, r.updated_at);
    }
    return map;
}
