import { NITRO_SQLITE_NULL } from "react-native-nitro-sqlite";
import { getSupastashConfig } from "../core/config";
export function isTrulyNullish(value) {
    return (value === null ||
        value === undefined ||
        (typeof value === "string" &&
            (value.trim().toLowerCase() === "null" ||
                value.trim().toLowerCase() === "undefined" ||
                value.trim() === "")) ||
        (typeof value === "number" && isNaN(value)));
}
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
let isNitro = null;
/**
 * Converts a value into a stable JSON string representation.
 *
 * @param value - The value to convert
 * @returns A stable stringified version of the input
 */
export function getSafeValue(value) {
    if (isNitro === null) {
        isNitro = getSupastashConfig().sqliteClientType === "rn-nitro";
    }
    if (isTrulyNullish(value)) {
        return isNitro ? NITRO_SQLITE_NULL : undefined;
    }
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
