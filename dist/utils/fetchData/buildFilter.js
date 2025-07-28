export function buildFilterString(filters) {
    if (!filters) {
        return undefined;
    }
    const { column, operator, value } = filters;
    if (value === null) {
        return `${String(column)}=${operator}.null`;
    }
    if (operator === "in" && Array.isArray(value)) {
        return `${String(column)}=in.(${value.join(",")})`;
    }
    return `${String(column)}=${operator}.${value}`;
}
export function buildFilterForSql(filter) {
    if (!filter)
        return undefined;
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
            if (!Array.isArray(value)) {
                throw new Error("Value must be an array for 'in' operator");
            }
            const list = value.map(sqlValue).join(", ");
            return `${String(column)} IN (${list})`;
        case "is":
            return `${String(column)} IS ${sqlValue(value)}`;
        default:
            throw new Error(`Unsupported operator: ${operator}`);
    }
}
function sqlValue(val) {
    if (Array.isArray(val)) {
        return val.map(sqlValue).join(", ");
    }
    if (val === null)
        return "NULL";
    if (typeof val === "number")
        return val.toString();
    return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
}
