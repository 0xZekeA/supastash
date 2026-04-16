export function interpolate(sql, params) {
    let i = 0;
    return sql.replace(/\?|\$\d+/g, () => {
        const val = params[i++];
        if (val === null || val === undefined)
            return "NULL";
        if (typeof val === "number")
            return Number.isFinite(val) ? String(val) : "NULL";
        if (typeof val === "boolean")
            return val ? "1" : "0";
        if (val instanceof Uint8Array || val instanceof ArrayBuffer)
            return "X'" + Buffer.from(val).toString("hex") + "'";
        return `'${String(val).replace(/'/g, "''")}'`;
    });
}
export function namedToPositional(sql, params) {
    const positional = [];
    const rewritten = sql.replace(/[$:@]([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
        if (!(key in params)) {
            throw new Error(`Missing SQL param: "${key}"`);
        }
        positional.push(params[key]);
        return "?";
    });
    return { sql: rewritten, params: positional };
}
