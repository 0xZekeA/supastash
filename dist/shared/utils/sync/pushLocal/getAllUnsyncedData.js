import { getSupastashDb } from "../../../db/dbInitializer";
import { tableFilters } from "../../../store/tableFilters";
import { getTableSchema } from "../../getTableSchema";
import log from "../../logs";
import { getRemoteTableSchema } from "../status/remoteSchema";
const sharedKeysCache = new Map();
const VALID_OPERATORS = new Set([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "is",
    "in",
]);
function escapeColumn(column) {
    // Basic guard against injection via column names (should only ever be internal identifiers)
    return `"${column.replace(/"/g, '""')}"`;
}
/**
 * Builds a single SQL clause + params for one filter condition.
 * Returns null (instead of throwing) if the filter is malformed.
 */
function buildSingleClause(f) {
    try {
        // Composite OR filter: { or: SupastashFilter[] }
        if ("or" in f && Array.isArray(f.or)) {
            const orFilters = f.or;
            const built = orFilters
                .map((sub) => buildSingleClause(sub))
                .filter((c) => !!c);
            if (!built.length)
                return null;
            const sql = "(" + built.map((c) => c.sql).join(" OR ") + ")";
            const params = built.flatMap((c) => c.params);
            return { sql, params };
        }
        // Flat filter: { column, operator, value }
        const { column, operator, value } = f;
        if (!column || !operator || !VALID_OPERATORS.has(operator)) {
            log(`[Supastash] Skipping invalid filter: ${JSON.stringify(f)}`);
            return null;
        }
        const col = escapeColumn(column);
        switch (operator) {
            case "is":
                // sqlite uses IS for null comparisons; also support IS TRUE/FALSE-ish via 0/1
                if (value === null) {
                    return { sql: `${col} IS NULL`, params: [] };
                }
                return { sql: `${col} IS ?`, params: [value] };
            case "in": {
                const values = Array.isArray(value) ? value : [value];
                if (!values.length)
                    return null;
                const placeholders = values.map(() => "?").join(", ");
                return { sql: `${col} IN (${placeholders})`, params: values };
            }
            case "eq":
                return { sql: `${col} = ?`, params: [value] };
            case "neq":
                return { sql: `${col} != ?`, params: [value] };
            case "gt":
                return { sql: `${col} > ?`, params: [value] };
            case "gte":
                return { sql: `${col} >= ?`, params: [value] };
            case "lt":
                return { sql: `${col} < ?`, params: [value] };
            case "lte":
                return { sql: `${col} <= ?`, params: [value] };
            default:
                return null;
        }
    }
    catch (err) {
        log(`[Supastash] Failed to build filter clause: ${String(err)}`);
        return null;
    }
}
/**
 * Builds a combined " AND (...)" SQL string + params array from a list of filters.
 * Never throws — malformed filters are skipped and logged.
 */
export function buildFilterSql(filters) {
    if (!filters?.length)
        return { sql: "", params: [] };
    const clauses = filters
        .map((f) => buildSingleClause(f))
        .filter((c) => !!c);
    if (!clauses.length)
        return { sql: "", params: [] };
    const sql = " AND " + clauses.map((c) => c.sql).join(" AND ");
    const params = clauses.flatMap((c) => c.params);
    return { sql, params };
}
async function getRemoteKeys(table) {
    if (sharedKeysCache.has(table)) {
        return sharedKeysCache.get(table);
    }
    const remoteSchema = await getRemoteTableSchema(table);
    if (!remoteSchema)
        return null;
    const remoteKeys = remoteSchema.map((col) => col.column_name);
    const localSchema = await getTableSchema(table);
    if (!localSchema)
        return null;
    const localKeys = localSchema;
    const sharedKeys = remoteKeys.filter((key) => localKeys.includes(key));
    const missingKeys = remoteKeys.filter((key) => !localKeys.includes(key) && key !== "synced_at" && key !== "arrived_at");
    if (missingKeys.length > 0) {
        log(`[Supastash] Missing keys for table ${table}: ${missingKeys.join(", ")}`);
    }
    sharedKeysCache.set(table, sharedKeys);
    return sharedKeys.length ? sharedKeys : null;
}
/**
 * Gets all unsynced data from a table
 * @param table - The table to get the data from
 * @returns The unsynced data
 */
export async function getAllUnsyncedData(table) {
    const db = await getSupastashDb();
    const filters = tableFilters.get(table) ?? [];
    const filterSqlDetails = buildFilterSql(filters);
    const remoteKeys = await getRemoteKeys(table);
    if (!remoteKeys) {
        const query = `SELECT * FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL${filterSqlDetails.sql}`;
        const data = await db.getAllAsync(query, filterSqlDetails.params);
        return data ?? null;
    }
    const columns = remoteKeys.join(", ");
    const query = `SELECT ${columns} FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL${filterSqlDetails.sql}`;
    const data = await db.getAllAsync(query, filterSqlDetails.params);
    return data ?? null;
}
/**
 * Gets all deleted data from a table
 * @param table - The table to get the data from
 * @returns The deleted data
 */
export async function getAllDeletedData(table) {
    const db = await getSupastashDb();
    const filters = tableFilters.get(table) ?? [];
    const filterSqlDetails = buildFilterSql(filters);
    const data = await db.getAllAsync(`SELECT deleted_at, id FROM ${table} WHERE deleted_at IS NOT NULL${filterSqlDetails.sql}`, filterSqlDetails.params);
    return data ?? null;
}
