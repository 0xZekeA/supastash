import { getSupastashConfig } from "../../core/config";
import { isDebugMode } from "../../utils/logs";
import { namedToPositional } from "../normalizer";
export const SQLiteAdapterNitro = {
    async openDatabaseAsync(name, sqliteClient) {
        //Enable simple null handling for Nitro SQLite
        const config = getSupastashConfig();
        if (!config.hasEnabledSimpleNullHandling && isDebugMode()) {
            console.warn("[Supastash] Nitro SQLite detected. Call `enableSimpleNullHandling()` at the top of your app to ensure correct null behavior (see: https://libraries.io/npm/@vertexmd%2Freact-native-nitro-sqlite#simplified-null-handling). If already enabled, set `hasEnabledSimpleNullHandling: true` in Supastash config to silence this warning.");
        }
        const db = await sqliteClient.open({ name, location: "default" });
        return {
            runAsync: async (sql, params) => {
                await db.executeAsync(sql, params ?? []);
            },
            execAsync: async (statement) => {
                await db.executeAsync(statement);
            },
            getAllAsync: async (sql, params) => {
                const result = await db.executeAsync(sql, params ?? []);
                const mainResult = result.rows?._array ?? [];
                return mainResult;
            },
            getFirstAsync: async (sql, params) => {
                const result = await db.executeAsync(sql, params ?? []);
                return result.rows?._array?.[0] ?? null;
            },
            query: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                const result = await db.executeAsync(q, p ?? []);
                const mainResult = result.rows?._array ?? [];
                return mainResult;
            },
            queryOne: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                const result = await db.executeAsync(q, p ?? []);
                return result.rows?._array?.[0] ?? null;
            },
            execute: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                return await db.executeAsync(q, p ?? []);
            },
            closeAsync: async () => {
                await db.close?.();
            },
            withTransaction: async (fn) => {
                const statements = [];
                const enqueue = (sql, params) => {
                    statements.push({ sql, params });
                };
                const txExecutor = {
                    runAsync: async (sql, params) => {
                        enqueue(sql, params ?? []);
                    },
                    execAsync: async (statement) => {
                        enqueue(statement, []);
                    },
                    getAllAsync: async (sql, params) => {
                        const result = await db.executeAsync(sql, params ?? []);
                        return result.rows?._array ?? [];
                    },
                    getFirstAsync: async (sql, params) => {
                        const result = await db.executeAsync(sql, params ?? []);
                        return result.rows?._array?.[0] ?? null;
                    },
                    query: async (sql, params) => {
                        const { sql: q, params: p } = params
                            ? namedToPositional(sql, params)
                            : { sql, params: [] };
                        const result = await db.executeAsync(q, p ?? []);
                        return result.rows?._array ?? [];
                    },
                    queryOne: async (sql, params) => {
                        const { sql: q, params: p } = params
                            ? namedToPositional(sql, params)
                            : { sql, params: [] };
                        const result = await db.executeAsync(q, p ?? []);
                        return result.rows?._array?.[0] ?? null;
                    },
                    execute: async (sql, params) => {
                        const { sql: q, params: p } = params
                            ? namedToPositional(sql, params)
                            : { sql, params: [] };
                        enqueue(q, p ?? []);
                        return {};
                    },
                };
                await fn(txExecutor);
                if (statements.length === 0)
                    return;
                await db.executeAsync("BEGIN");
                try {
                    for (const { sql, params } of statements) {
                        await db.executeAsync(sql, params);
                    }
                    await db.executeAsync("COMMIT");
                }
                catch (err) {
                    await db.executeAsync("ROLLBACK").catch(() => { });
                    throw err;
                }
            },
        };
    },
};
