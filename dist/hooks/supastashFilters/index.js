import { useEffect } from "react";
import { filterTracker, tableFilters, tableFiltersUsed, } from "../../store/tableFilters";
import { logWarn } from "../../utils/logs";
import isValidFilter, { warnOnMisMatch, } from "../../utils/sync/pullFromRemote/validateFilters";
import { checkIfTableExist } from "../../utils/tableValidator";
function warnInvalidFilter(filter, table) {
    logWarn(`[Supastash] Invalid filter: ${JSON.stringify(filter)} for table ${table}`);
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
export default function useSupastashFilters(filters) {
    useEffect(() => {
        let cancelled = false;
        async function run() {
            const incoming = Object.keys(filters ?? {});
            // Remove stale tables
            for (const t of Array.from(tableFilters.keys())) {
                if (!incoming.includes(t)) {
                    tableFilters.delete(t);
                    tableFiltersUsed.delete(t);
                    filterTracker.delete(t);
                }
            }
            // Existence check + per-table registration
            const existence = await Promise.all(incoming.map(async (t) => [t, await checkIfTableExist(t)]));
            if (cancelled)
                return;
            for (const [table, exists] of existence) {
                if (!exists) {
                    logWarn(`Table '${table}' does not exist; skipping filters`);
                    continue;
                }
                const raw = filters[table] ?? [];
                const valid = raw.filter((f) => isValidFilter([f]));
                if (!valid.length) {
                    tableFilters.delete(table);
                    tableFiltersUsed.delete(table);
                    filterTracker.delete(table);
                    continue;
                }
                // Warn on signature change and store a cloned array
                warnOnMisMatch(table, valid);
                tableFilters.set(table, valid.map((v) => ({ ...v })));
                tableFiltersUsed.add(table);
            }
        }
        void run();
        return () => {
            cancelled = true;
        };
    }, [filters]);
}
