import { filterTracker, tableFilters, tableFiltersUsed, } from "../../../store/tableFilters";
import { logWarn } from "../../logs";
import { checkIfTableExist } from "../../tableValidator";
import isValidFilter, { warnOnMisMatch } from "./validateFilters";
/**
 * Updates the filter for the given table
 * Non-hook version of useSupastashFilters
 *
 * Filters are validated and stored in the tableFilters store
 * @param filters - The filters to update
 */
export async function updateFilters(filters) {
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
