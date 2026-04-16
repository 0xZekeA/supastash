import { namedToPositional } from "../normalizer";
export const SQLiteAdapterTauri = {
    async openDatabaseAsync(name, sqliteClient) {
        const db = await sqliteClient.load(`sqlite:${name}`);
        const normalizeParams = (params) => {
            return (params ?? []).map((v) => typeof v === "boolean" ? (v ? 1 : 0) : v);
        };
        return {
            runAsync: async (sql, params) => {
                const normalized = normalizeParams(params);
                await db.execute(sql, normalized ?? []);
            },
            execAsync: async (statement) => {
                await db.execute(statement);
            },
            getAllAsync: async (sql, params) => {
                const normalized = normalizeParams(params);
                const rows = await db.select(sql, normalized ?? []);
                return rows ?? [];
            },
            getFirstAsync: async (sql, params) => {
                const normalized = normalizeParams(params);
                const rows = (await db.select(sql, normalized ?? []));
                return rows?.[0] ?? null;
            },
            query: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                const normalized = normalizeParams(p);
                return (await db.select(q, normalized));
            },
            queryOne: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                const normalized = normalizeParams(p);
                const rows = (await db.select(q, normalized));
                return rows?.[0] ?? null;
            },
            execute: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                return (await db.execute(q, p));
            },
            closeAsync: async () => {
                if (typeof db.close === "function") {
                    await db.close();
                }
            },
            withTransaction: async (fn) => {
                const statements = [];
                const enqueue = (sql, params) => {
                    statements.push(interpolate(sql, params));
                };
                const txExecutor = {
                    runAsync: async (sql, params) => {
                        enqueue(sql, params ?? []);
                    },
                    execAsync: async (statement) => {
                        statements.push(statement);
                    },
                    getAllAsync: async (sql, params) => (await db.select(sql, params ?? [])) ?? [],
                    getFirstAsync: async (sql, params) => (await db.select(sql, params ?? []))?.[0] ?? null,
                    query: async (sql, params) => {
                        const { sql: q, params: p } = params
                            ? namedToPositional(sql, params)
                            : { sql, params: [] };
                        return (await db.select(q, p));
                    },
                    queryOne: async (sql, params) => {
                        const { sql: q, params: p } = params
                            ? namedToPositional(sql, params)
                            : { sql, params: [] };
                        return (await db.select(q, p))?.[0] ?? null;
                    },
                    execute: async (sql, params) => {
                        const { sql: q, params: p } = params
                            ? namedToPositional(sql, params)
                            : { sql, params: [] };
                        enqueue(q, p);
                        return {};
                    },
                };
                await fn(txExecutor);
                if (statements.length === 0)
                    return;
                const batch = `BEGIN; ${statements.join("; ")}; COMMIT;`;
                try {
                    await db.execute(batch, []);
                }
                catch (err) {
                    await db.execute("ROLLBACK;", []).catch(() => { });
                    throw err;
                }
            },
        };
    },
};
function interpolate(sql, params) {
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
