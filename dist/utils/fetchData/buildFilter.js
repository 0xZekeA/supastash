export function buildFilterString(filters) {
    if (!filters) {
        return undefined;
    }
    const { column, operator, value } = filters;
    if (value === null) {
        return `${column}=${operator}.null`;
    }
    if (operator === "in" && Array.isArray(value)) {
        return `${column}=in.(${value.join(",")})`;
    }
    return `${column}=${operator}.${value}`;
}
