import { LiteQueryOptions } from "../../types/liteQuery.types";
import { SupastashFilter } from "../../types/realtimeData.types";
import { getTableSchema } from "../getTableSchema";
import { logError, logWarn } from "../logs";
import { ReusedHelpers } from "../reusedHelpers";

export function parseJSONColumns<R extends Record<string, any>>(row: R): R {
  const parsedRow: R = { ...row };
  const errors: string[] = [];

  for (const key in parsedRow) {
    const value = parsedRow[key];
    if (
      typeof value === "string" &&
      (value.startsWith("{") || value.startsWith("["))
    ) {
      try {
        parsedRow[key] = JSON.parse(value);
      } catch (error) {
        errors.push(`Failed to parse JSON in column ${key}: ${error}`);
      }
    }
  }

  if (errors.length > 0) {
    logWarn(`[Supastash] JSON parsing errors: ${errors.join(", ")}`);
  }

  return parsedRow;
}

export function sanitizeTableName(table: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  return table;
}

export function sanitizeOrderBy(orderBy: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(orderBy)) {
    throw new Error(`Invalid order by column: ${orderBy}`);
  }
  return orderBy;
}

function buildFilterKey(
  table: string,
  filters?: LiteQueryOptions["sqlFilter"]
): string {
  return `${table}:${JSON.stringify(filters ?? [])}`;
}

const filterCache = new Map<string, string>();

export async function buildFilters<R = any>(
  filters: SupastashFilter<R>[],
  table: string,
  noChecks: boolean = false
): Promise<string> {
  if (!filters || filters.length === 0) return "";

  const filterKey = buildFilterKey(table, filters);

  let sqlFilter = filterCache.get(filterKey);

  try {
    let schemaColumns: string[] = [];
    if (!noChecks) {
      const schema = await getTableSchema(table);
      schemaColumns = schema.map((col) => col.trim().toLowerCase());
    }
    const filterStringArray: string[] = [];

    for (const filter of filters) {
      if ("or" in filter) {
        try {
          const filterSql = ReusedHelpers.buildFilterForSql(filter);
          if (filterSql) {
            filterStringArray.push(filterSql);
          }
        } catch (error) {
          logError(
            `[Supastash] Failed to build OR filter for table ${table}:`,
            error
          );
        }
        continue;
      }

      if (!filter?.column) {
        logWarn(`[Supastash] Skipping filter with missing column`);
        continue;
      }

      const columnLower = String(filter.column).trim().toLowerCase();
      if (!noChecks && !schemaColumns.includes(columnLower)) {
        logWarn(
          `[Supastash] Filter column ${String(
            filter.column
          )} does not exist in table ${table}`
        );
        continue;
      }

      try {
        const filterSql = ReusedHelpers.buildFilterForSql(filter);
        if (filterSql) {
          filterStringArray.push(filterSql);
        }
      } catch (error) {
        logError(
          `[Supastash] Failed to build filter for column ${String(
            filter.column
          )}:`,
          error
        );
      }
    }

    return filterStringArray.length > 0
      ? ` AND ${filterStringArray.join(" AND ")}`
      : "";
  } catch (error) {
    logError(`[Supastash] Failed to build filters for table ${table}:`, error);
    return "";
  }
}
