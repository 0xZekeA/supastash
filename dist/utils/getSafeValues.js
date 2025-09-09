const isPlainObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNullishString = (s) => {
    const t = s.trim().toLowerCase();
    return t === "" || t === "null" || t === "undefined" || t === "nan";
};
// Only parse if string looks like JSON container
function tryJsonContainer(s) {
    if (typeof s !== "string")
        return;
    const t = s.trim();
    if (t[0] !== "{" && t[0] !== "[")
        return;
    try {
        return JSON.parse(t);
    }
    catch {
        return;
    }
}
/**
 * Parse a Postgres 1-D array literal into JS values, preserving order.
 * Handles quoted items, escaped quotes, backslashes, whitespace.
 * Unquoted NULL is converted to null; quoted "NULL" stays "NULL".
 * Returns undefined if the input is not a PG array literal.
 */
function parsePgArrayLiteral(input) {
    const s = input.trim();
    if (!(s.startsWith("{") && s.endsWith("}")))
        return;
    const out = [];
    let i = 1; // after '{'
    let cur = "";
    let inQuotes = false;
    // helper to push current token
    const pushToken = () => {
        const raw = cur.trim();
        if (!inQuotes && raw.toUpperCase() === "NULL") {
            out.push(null);
        }
        else {
            out.push(raw);
        }
        cur = "";
    };
    while (i < s.length - 1) {
        // before '}'
        const ch = s[i];
        if (inQuotes) {
            if (ch === '"') {
                // doubled quote inside quoted token => literal quote
                if (s[i + 1] === '"') {
                    cur += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i++;
                continue;
            }
            if (ch === "\\" && i + 1 < s.length - 1) {
                cur += s[i + 1];
                i += 2;
                continue;
            }
            cur += ch;
            i++;
            continue;
        }
        // not in quotes
        if (ch === '"') {
            inQuotes = true;
            i++;
            continue;
        }
        if (ch === ",") {
            pushToken();
            i++;
            continue;
        }
        cur += ch;
        i++;
    }
    pushToken();
    if (out.length === 1 && out[0] === "")
        return [];
    return out;
}
export function normalizeForSupabase(row) {
    const seen = new WeakSet();
    function norm(v) {
        if (v === null || v === undefined)
            return null;
        if (typeof v === "boolean" || typeof v === "number")
            return v;
        if (typeof v === "string") {
            if (isNullishString(v))
                return null;
            // JSON object/array in a string?
            const asJson = tryJsonContainer(v);
            if (asJson !== undefined)
                return norm(asJson);
            // Postgres array literal?
            const pg = parsePgArrayLiteral(v);
            if (pg)
                return pg.map((item) => norm(item));
            return v;
        }
        if (Array.isArray(v)) {
            return v.map((item) => norm(item));
        }
        if (isPlainObj(v)) {
            if (seen.has(v))
                return null;
            seen.add(v);
            const out = {};
            for (const k of Object.keys(v)) {
                out[k] = norm(v[k]);
            }
            return out;
        }
        return v; // fallback: do nothing
    }
    if (!isPlainObj(row))
        return row;
    const out = {};
    for (const k of Object.keys(row))
        out[k] = norm(row[k]);
    return out;
}
