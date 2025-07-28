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
export function warnOnMisMatch(table, filters) {
    const existingFilters = filterTracker.get(table);
    if (existingFilters) {
        const changes = [];
        const maxLength = Math.max(existingFilters.length, filters.length);
        for (let i = 0; i < maxLength; i++) {
            const oldFilter = existingFilters[i];
            const newFilter = filters[i];
            if (!oldFilter || !newFilter) {
                changes.push(`  • Filter ${i + 1} was added or removed entirely.`);
                continue;
            }
            const { column: oldCol, operator: oldOp } = oldFilter;
            const { column: newCol, operator: newOp } = newFilter;
            if (oldCol !== newCol || oldOp !== newOp) {
                changes.push(`  • Filter ${i + 1} changed:\n` +
                    `    → Column: '${String(oldCol)}' → '${String(newCol)}'\n` +
                    `    → Operator: '${oldOp}' → '${newOp}'`);
            }
        }
        if (changes.length > 0) {
            logWarn(`[Supastash] Filter signature mismatch for table '${table}'.`);
            logWarn(`[Supastash] The filter structure (column/operator) has changed — this may lead to inconsistent sync behavior.`);
            logWarn(`[Supastash] Differences:\n${changes.join("\n")}`);
        }
    }
    filterTracker.set(table, filters);
}
