import { filterTracker } from "../../../store/tableFilters";
import { SupastashFilter } from "../../../types/realtimeData.types";
import { logWarn } from "../../logs";

const tablesWarned = new Set<string>();
const debounceWarnTime = 2_000;
let debounceWarnTimeout: ReturnType<typeof setTimeout> | null = null;

export function warnOnMisMatch<R = any>(
  table: string,
  filters: SupastashFilter<R>[]
) {
  const existingFilters = filterTracker.get(table);
  let hasMismatch = false;

  if (existingFilters) {
    const maxLength = Math.max(existingFilters.length, filters.length);

    for (let i = 0; i < maxLength; i++) {
      const oldFilter = existingFilters[i];
      const newFilter = filters[i];
      if ("or" in oldFilter || "or" in newFilter) {
        if ("or" in oldFilter && "or" in newFilter) {
          if (oldFilter.or.length !== newFilter.or.length) {
            hasMismatch = true;
            break;
          }
        }
        continue;
      }

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
