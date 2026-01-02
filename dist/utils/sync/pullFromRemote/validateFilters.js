import { filterTracker } from "../../../store/tableFilters";
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
function isValidFilter(filters) {
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
                if (!(value === null ||
                    value === "null" ||
                    value === "true" ||
                    value === "false")) {
                    return false;
                }
                break;
            case "in":
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return false;
                    }
                }
                else if (typeof value === "string") {
                    const trimmed = value.trim();
                    if (trimmed === "" ||
                        trimmed.split(",").filter((item) => item.trim() !== "").length === 0) {
                        return false;
                    }
                }
                else {
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
const tablesWarned = new Set();
const debounceWarnTime = 2000;
let debounceWarnTimeout = null;
export function warnOnMisMatch(table, filters) {
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
            if (oldFilter.column !== newFilter.column ||
                oldFilter.operator !== newFilter.operator) {
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
            logWarn(`[Supastash] Conflicting filters detected for table(s): ${Array.from(tablesWarned).join(", ")}. The same table is being synced with different filters across multiple calls. This can cause incomplete or inconsistent local data. Ensure each table is registered with a single, consistent filter.`);
            tablesWarned.clear();
            debounceWarnTimeout = null;
        }, debounceWarnTime);
    }
    filterTracker.set(table, filters);
}
