import { filterTracker } from "../../../store/tableFilters";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import { logWarn } from "../../logs";

const validOperators = new Set([
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
  "is",
  "in",
]);

function isValidFilter<R = any>(filters: RealtimeFilter<R>[]): boolean {
  for (const filter of filters ?? []) {
    if (!filter || typeof filter !== "object") {
      return false;
    }

    const { column, operator, value } = filter;

    if (typeof column !== "string" || column.trim() === "") {
      return false;
    }

    if (!validOperators.has(operator)) {
      return false;
    }

    switch (operator) {
      case "is":
        if (
          !(
            value === null ||
            value === "null" ||
            value === "true" ||
            value === "false"
          )
        ) {
          return false;
        }
        break;

      case "in":
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return false;
          }
        } else if (typeof value === "string") {
          const trimmed = value.trim();
          if (
            trimmed === "" ||
            trimmed.split(",").filter((item) => item.trim() !== "").length === 0
          ) {
            return false;
          }
        } else {
          return false;
        }
        break;

      default:
        if (value === undefined || value === null) {
          return false;
        }
        break;
    }
  }

  return true;
}

export default isValidFilter;

const tablesWarned = new Set<string>();
const debounceWarnTime = 2_000;
let debounceWarnTimeout: ReturnType<typeof setTimeout> | null = null;

export function warnOnMisMatch<R = any>(
  table: string,
  filters: RealtimeFilter<R>[]
) {
  const existingFilters = filterTracker.get(table);
  let hasMismatch = false;

  if (existingFilters) {
    const maxLength = Math.max(existingFilters.length, filters.length);

    for (let i = 0; i < maxLength; i++) {
      const oldFilter = existingFilters[i];
      const newFilter = filters[i];

      if (!oldFilter || !newFilter) {
        hasMismatch = true;
        break;
      }

      if (
        oldFilter.column !== newFilter.column ||
        oldFilter.operator !== newFilter.operator
      ) {
        hasMismatch = true;
        break;
      }
    }
  }

  if (hasMismatch) {
    tablesWarned.add(table);

    if (debounceWarnTimeout) {
      clearTimeout(debounceWarnTimeout);
    }

    debounceWarnTimeout = setTimeout(() => {
      logWarn(
        `[Supastash] Conflicting filters detected for table(s): ${Array.from(
          tablesWarned
        ).join(", ")}. 
          Multiple sync calls registered different filters for the same table. 
          The last registered filter will be used, overriding previous ones. 
          Ensure each table is registered with a single, consistent filter to avoid unintended data scope.`
      );

      tablesWarned.clear();
      debounceWarnTimeout = null;
    }, debounceWarnTime);
  }

  filterTracker.set(table, filters);
}
