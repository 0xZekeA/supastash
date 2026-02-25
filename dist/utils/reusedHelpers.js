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
export const ReusedHelpers = {
    isValidFilter(filters) {
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
                    if (typeof value === "boolean") {
                        // normalize
                        filter.value = value ? "true" : "false";
                        break;
                    }
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
                            trimmed.split(",").filter((item) => item.trim() !== "").length ===
                                0) {
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
    },
    applyFilters(q, filters, table) {
        for (const f of filters) {
            if (!ReusedHelpers.isValidFilter([f])) {
                throw new Error(`Invalid syncFilter: ${JSON.stringify(f)} for ${table}`);
            }
            q = q[f.operator](f.column, f.value);
        }
        return q;
    },
};
