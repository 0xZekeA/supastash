import { useEffect } from "react";
import { tableFilters, tableFiltersUsed } from "../../store/tableFilters";
import { RealtimeFilter } from "../../types/realtimeData.types";
import { SupastashFilter } from "../../types/supastashFilters.types";
import { logWarn } from "../../utils/logs";
import isValidFilter, {
  warnOnMisMatch,
} from "../../utils/sync/pullFromRemote/validateFilters";
import { checkIfTableExist } from "../../utils/tableValidator";

function warnInvalidFilter(filter: RealtimeFilter, table: string) {
  logWarn(
    `[Supastash] Invalid filter: ${JSON.stringify(filter)} for table ${table}`
  );
}

/**
 * useSupastashFilters
 *
 * @description
 * Registers filters used for Supastash pull sync logic.
 *
 * This hook should be called at app startup or anywhere your filter configuration might change.
 * You should provide filters for **all tables** unless your Supabase project uses strict SELECT RLS (Row Level Security) policies.
 *
 * The hook validates filter structure, warns about invalid filters, and detects any mismatch in column/operator structure
 * to prevent sync inconsistencies.
 *
 * 🚨 Incorrect or mismatched filters can lead to unreliable syncing behavior.
 *
 * @example
 * ```ts
 * useSupastashFilters({
 *   orders: [
 *     { column: "shop_id", operator: "eq", value: currentShopId },
 *     { column: "status", operator: "in", value: ["pending", "completed"] },
 *   ],
 *   inventory: [
 *     { column: "location_id", operator: "eq", value: activeLocationId },
 *   ],
 * });
 * ```
 *
 * @param {SupastashFilter} filters - An object where each key is a table name, and its value is
 *   an array of `RealtimeFilter` objects that define the filter criteria for that table's pull sync.
 *
 * @note This hook does not re-run unless the `filters` object reference changes.
 *       To force re-evaluation, pass a fresh object (not just mutated data).
 */
export default function useSupastashFilters(filters: SupastashFilter) {
  useEffect(() => {
    const addFilters = async () => {
      for (const table in filters) {
        const tableInDb = await checkIfTableExist(table);
        if (!tableInDb) {
          logWarn(`Table ${table} does not exist`);
          continue;
        }
        const filtersForTable = filters[table];
        if (!filtersForTable) {
          logWarn(`No filters for table ${table}`);
          continue;
        }

        const validFilters = filtersForTable.filter((f) => {
          const isValid = isValidFilter([f]);
          if (!isValid) warnInvalidFilter(f, table);
          return isValid;
        });
        if (validFilters.length > 0) {
          warnOnMisMatch(table, validFilters);
          tableFilters.set(table, validFilters);
          tableFiltersUsed.add(table);
        }
      }
    };
    void addFilters();
  }, [filters]);
}
