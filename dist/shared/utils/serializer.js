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
 * Deterministically stringify any value:
 * - Sorts object keys for stability
 * - Converts Date -> ISO string
 * - Converts BigInt -> string
 * - Replaces NaN/Infinity/undefined with null
 * - Handles circular references
 */
export function stableStringify(input) {
    const seen = new WeakSet();
    const sanitize = (val) => {
        if (val === null)
            return null;
        const t = typeof val;
        if (t === "number") {
            return Number.isFinite(val) ? val : null;
        }
        if (t === "bigint")
            return val.toString();
        if (t === "string")
            return val;
        if (t === "boolean")
            return val;
        if (val instanceof Date)
            return val.toISOString();
        if (Array.isArray(val)) {
            return val.map((v) => sanitize(v));
        }
        if (t === "object") {
            if (seen.has(val))
                return "[Circular]";
            seen.add(val);
            const out = {};
            for (const k of Object.keys(val).sort()) {
                out[k] = sanitize(val[k]);
            }
            seen.delete(val);
            return out;
        }
        // functions/symbol/undefined -> null
        return null;
    };
    return JSON.stringify(sanitize(input));
}
/**
 * Normalize a value to something SQLite can bind safely:
 * - Dates -> ISO string
 * - Booleans -> 1/0
 * - Arrays/Objects -> stable JSON string
 * - BigInt -> string
 * - undefined/NaN/Infinity -> null
 * - Everything else passes through
 */
export function getSafeValue(value) {
    if (value === undefined)
        return null;
    if (typeof value === "number" && !Number.isFinite(value))
        return null;
    if (value instanceof Date)
        return value.toISOString();
    if (typeof value === "bigint")
        return value.toString();
    if (typeof value === "boolean")
        return value ? 1 : 0;
    if (Array.isArray(value))
        return stableStringify(value);
    if (value && typeof value === "object")
        return stableStringify(value);
    return value;
}
