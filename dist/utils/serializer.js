/**
 * Converts a value into a stable JSON string representation.
 *
 * @param obj - The object to convert
 * @returns A stable stringified version of the input
 */
function stableStringify(obj) {
    if (Array.isArray(obj))
        return JSON.stringify(obj);
    if (typeof obj === "object" && obj !== null) {
        return JSON.stringify(Object.keys(obj)
            .sort()
            .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {}));
    }
    return JSON.stringify(obj);
}
/**
 * Converts a value into a stable JSON string representation.
 *
 * @param value - The value to convert
 * @returns A stable stringified version of the input
 */
export function getSafeValue(value) {
    if (value === null || value === undefined)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    if (Array.isArray(value)) {
        const allPrimitives = value.every((v) => typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean" ||
            v === null);
        if (allPrimitives)
            return value;
        const allObjects = value.every((v) => typeof v === "object" && v !== null);
        if (allObjects)
            return value.map(stableStringify);
        return stableStringify(value);
    }
    if (typeof value === "object")
        return stableStringify(value);
    return value;
}
