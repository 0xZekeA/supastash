export function stringifyComplexFields(record) {
    const result = {};
    for (const key in record) {
        result[key] = stringifyValue(record[key]);
    }
    return result;
}
export function stringifyValue(value) {
    if (value == null || value === undefined) {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string" || typeof value === "boolean") {
        return value;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    return null;
}
