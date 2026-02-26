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
        if (!Array.isArray(filters))
            return false;
        const validateNode = (node) => {
            if (!node || typeof node !== "object")
                return false;
            // OR group
            if ("or" in node) {
                if (!Array.isArray(node.or) || node.or.length === 0) {
                    return false;
                }
                return node.or.every(validateNode);
            }
            // Condition
            const { column, operator, value } = node;
            if (typeof column !== "string" || column.trim() === "") {
                return false;
            }
            if (!validOperators.has(operator)) {
                return false;
            }
            switch (operator) {
                case "is":
                    return (value === null ||
                        value === true ||
                        value === false ||
                        value === "null" ||
                        value === "true" ||
                        value === "false");
                case "in":
                    return Array.isArray(value) && value.length > 0;
                default:
                    return value !== undefined && value !== null;
            }
        };
        return filters.every(validateNode);
    },
    applyFilters(q, filters, table) {
        for (const f of filters) {
            // OR group
            if ("or" in f) {
                if (!Array.isArray(f.or) || f.or.length === 0) {
                    throw new Error(`Invalid OR filter for ${table}`);
                }
                const orString = f.or
                    .map((sub) => {
                    if (!ReusedHelpers.isValidFilter([sub])) {
                        throw new Error(`Invalid OR syncFilter: ${JSON.stringify(sub)} for ${table}`);
                    }
                    return `${String(sub.column)}.${sub.operator}.${sub.value}`;
                })
                    .join(",");
                q = q.or(orString);
                continue;
            }
            // Normal AND filter
            if (!ReusedHelpers.isValidFilter([f])) {
                throw new Error(`Invalid syncFilter: ${JSON.stringify(f)} for ${table}`);
            }
            q = q[f.operator](f.column, f.value);
        }
        return q;
    },
    buildFilterString(filter) {
        if (!filter)
            return undefined;
        // OR group
        if ("or" in filter) {
            if (!Array.isArray(filter.or) || filter.or.length === 0) {
                return undefined;
            }
            const inner = filter.or
                .map((f) => {
                if ("and" in f || "or" in f) {
                    return undefined; // nested groups not supported here
                }
                if (f.value === null) {
                    return `${String(f.column)}.${f.operator}.null`;
                }
                if (f.operator === "in" && Array.isArray(f.value)) {
                    return `${String(f.column)}.in.(${f.value.join(",")})`;
                }
                return `${String(f.column)}.${f.operator}.${f.value}`;
            })
                .filter(Boolean)
                .join(",");
            return inner ? `or=(${inner})` : undefined;
        }
        // Condition
        const { column, operator, value } = filter;
        if (value === null) {
            return `${String(column)}=${operator}.null`;
        }
        if (operator === "in" && Array.isArray(value)) {
            return `${String(column)}=in.(${value.join(",")})`;
        }
        return `${String(column)}=${operator}.${value}`;
    },
    buildFilterForSql(filter) {
        if (!filter)
            return undefined;
        // OR group
        if ("or" in filter) {
            const parts = filter.or
                .map(ReusedHelpers.buildFilterForSql)
                .filter(Boolean);
            if (parts.length === 0)
                return undefined;
            return `(${parts.join(" OR ")})`;
        }
        const { column, operator, value } = filter;
        switch (operator) {
            case "eq":
                return value === null
                    ? `${String(column)} IS NULL`
                    : `${String(column)} = ${sqlValue(value)}`;
            case "neq":
                return value === null
                    ? `${String(column)} IS NOT NULL`
                    : `${String(column)} != ${sqlValue(value)}`;
            case "gt":
                return `${String(column)} > ${sqlValue(value)}`;
            case "lt":
                return `${String(column)} < ${sqlValue(value)}`;
            case "gte":
                return `${String(column)} >= ${sqlValue(value)}`;
            case "lte":
                return `${String(column)} <= ${sqlValue(value)}`;
            case "in":
                if (!Array.isArray(value))
                    return undefined;
                return `${String(column)} IN (${value.map(sqlValue).join(", ")})`;
            case "is":
                return `${String(column)} IS ${sqlValue(value)}`;
            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }
    },
};
function sqlValue(val) {
    if (Array.isArray(val)) {
        return val.map(sqlValue).join(", ");
    }
    if (typeof val === "boolean")
        return val ? "1" : "0";
    if (val === null)
        return "NULL";
    if (typeof val === "number")
        return val.toString();
    return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
}
