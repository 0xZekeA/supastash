import { getTableSchema } from "../getTableSchema";
import { logError, logWarn } from "../logs";
import { buildFilterForSql } from "./buildFilter";
export function parseJSONColumns(row) {
    const parsedRow = { ...row };
    const errors = [];
    for (const key in parsedRow) {
        const value = parsedRow[key];
        if (typeof value === "string" &&
            (value.startsWith("{") || value.startsWith("["))) {
            try {
                parsedRow[key] = JSON.parse(value);
            }
            catch (error) {
                errors.push(`Failed to parse JSON in column ${key}: ${error}`);
            }
        }
    }
    if (errors.length > 0) {
        logWarn(`[Supastash] JSON parsing errors: ${errors.join(", ")}`);
    }
    return parsedRow;
}
export function sanitizeTableName(table) {
    if (!/^[a-zA-Z0-9_-]+$/.test(table)) {
        throw new Error(`Invalid table name: ${table}`);
    }
    return table;
}
export function sanitizeOrderBy(orderBy) {
    if (!/^[a-zA-Z0-9_-]+$/.test(orderBy)) {
        throw new Error(`Invalid order by column: ${orderBy}`);
    }
    return orderBy;
}
function buildFilterKey(table, filters) {
    return `${table}:${JSON.stringify(filters ?? [])}`;
}
const filterCache = new Map();
export async function buildFilters(filters, table, noChecks = false) {
    if (!filters || filters.length === 0)
        return "";
    const filterKey = buildFilterKey(table, filters);
    let sqlFilter = filterCache.get(filterKey);
    try {
        let schemaColumns = [];
        if (!noChecks) {
            const schema = await getTableSchema(table);
            schemaColumns = schema.map((col) => col.trim().toLowerCase());
        }
        const filterStringArray = [];
        for (const filter of filters) {
            if (!filter?.column) {
                logWarn(`[Supastash] Skipping filter with missing column`);
                continue;
            }
            const columnLower = String(filter.column).trim().toLowerCase();
            if (!noChecks && !schemaColumns.includes(columnLower)) {
                logWarn(`[Supastash] Filter column ${String(filter.column)} does not exist in table ${table}`);
                continue;
            }
            try {
                const filterSql = buildFilterForSql(filter);
                if (filterSql) {
                    filterStringArray.push(filterSql);
                }
            }
            catch (error) {
                logError(`[Supastash] Failed to build filter for column ${String(filter.column)}:`, error);
            }
        }
        return filterStringArray.length > 0
            ? ` AND ${filterStringArray.join(" AND ")}`
            : "";
    }
    catch (error) {
        logError(`[Supastash] Failed to build filters for table ${table}:`, error);
        return "";
    }
}
// export async function fetchData<R = any>({
//   table,
//   options,
//   state,
//   isLoadMore,
//   isRefresh,
// }: FetchOptions<R>): Promise<FetchResult<R> | null> {
//   const db = await getSupastashDb();
//   const sanitizedTable = sanitizeTableName(table);
//   const sanitizedOrderBy = sanitizeOrderBy(options.orderBy ?? "created_at");
//   const limit = options.pageSize ?? 50;
//   const orderDirection = options.orderDesc === false ? "ASC" : "DESC";
//   const enableCursor = options.enableCursor !== false;
//   try {
//     const filters = await buildFilters(options.sqlFilter ?? [], sanitizedTable);
//     const staleTime = options.staleTime ?? 30000;
//     const isCacheStale = Date.now() - state.lastFetch > staleTime;
//     if (!isRefresh && !isLoadMore && state.data.length > 0 && !isCacheStale) {
//       logWarn(`[Supastash] Using cached data for ${table}`);
//       return null;
//     }
//     let query: string;
//     let params: any[] = [];
//     if (enableCursor && isLoadMore && state.cursor) {
//       const operator = orderDirection === "DESC" ? "<" : ">";
//       const snapshotClause = state.snapshotTime
//         ? ` AND created_at <= '${state.snapshotTime}'`
//         : "";
//       query = `
//         SELECT * FROM ${sanitizedTable}
//         WHERE deleted_at IS NULL${filters}${snapshotClause}
//         AND ${sanitizedOrderBy} ${operator} ?
//         ORDER BY ${sanitizedOrderBy} ${orderDirection}, id ${orderDirection}
//         LIMIT ${limit};
//       `;
//       params = [state.cursor];
//     } else {
//       const snapshotClause =
//         !isRefresh && state.snapshotTime
//           ? ` AND created_at <= '${state.snapshotTime}'`
//           : "";
//       query = `
//         SELECT * FROM ${sanitizedTable}
//         WHERE deleted_at IS NULL${filters}${snapshotClause}
//         ORDER BY ${sanitizedOrderBy} ${orderDirection}, id ${orderDirection}
//         LIMIT ${limit};
//       `;
//     }
//     const rows = await db.getAllAsync(query, params);
//     if (!rows || rows.length === 0) {
//       return {
//         data: [],
//         dataMap: new Map(),
//         groupedBy: undefined,
//         hasMore: false,
//         cursor: null,
//       };
//     }
//     const processed = await processRows<R>(
//       rows,
//       options.extraMapKeys,
//       sanitizedOrderBy
//     );
//     const newCursor =
//       enableCursor && rows.length > 0
//         ? rows[rows.length - 1][sanitizedOrderBy]
//         : null;
//     return {
//       data: processed.parsed,
//       dataMap: processed.dataMap,
//       groupedBy: processed.groupedBy,
//       hasMore: rows.length === limit,
//       cursor: newCursor,
//     };
//   } catch (error) {
//     logError(`[Supastash] Failed to fetch data from ${table}:`, error);
//     throw error;
//   }
// }
async function processRows(rows, extraMapKeys, orderByColumn) {
    const parsed = [];
    const dataMap = new Map();
    const groupedBy = {};
    for (const row of rows) {
        try {
            const parsedRow = parseJSONColumns(row);
            parsed.push(parsedRow);
            dataMap.set(row.id, parsedRow);
            if (extraMapKeys?.length) {
                for (const key of extraMapKeys) {
                    if (key === "id") {
                        logWarn(`[Supastash] Key 'id' is redundant - use dataMap.get(id)`);
                        continue;
                    }
                    if (parsedRow[key] == null) {
                        logWarn(`[Supastash] Item ${parsedRow.id} missing ${String(key)}`);
                        continue;
                    }
                    const groupVal = parsedRow[key];
                    if (!groupedBy[key])
                        groupedBy[key] = new Map();
                    if (!groupedBy[key].has(groupVal))
                        groupedBy[key].set(groupVal, []);
                    groupedBy[key].get(groupVal).push(parsedRow);
                }
            }
        }
        catch (error) {
            logError(`[Supastash] Failed to process row:`, error, row);
        }
    }
    return {
        parsed,
        dataMap,
        groupedBy: Object.keys(groupedBy).length > 0 ? groupedBy : undefined,
    };
}
