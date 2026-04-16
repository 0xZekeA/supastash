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
