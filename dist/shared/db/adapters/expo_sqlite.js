import { namedToPositional } from "../normalizer";
export const SQLiteAdapterExpo = {
    async openDatabaseAsync(name, sqliteClient) {
        const db = await sqliteClient.openDatabaseAsync(name);
        return {
            runAsync: async (sql, params) => {
                await db.runAsync(sql, params ?? []);
            },
            execAsync: async (statement) => {
                await db.execAsync(statement);
            },
            getAllAsync: async (sql, params) => {
                const result = await db.getAllAsync(sql, params ?? []);
                return result ?? [];
            },
            getFirstAsync: async (sql, params) => {
                const result = await db.getFirstAsync(sql, params ?? []);
                return result ?? null;
            },
            query: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                return await db.getAllAsync(q, p);
            },
            queryOne: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                return await db.getFirstAsync(q, p);
            },
            execute: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                return await db.runAsync(q, p);
            },
            closeAsync: async () => {
                await db.closeAsync?.();
            },
            withTransaction: async (fn) => {
                return await db.withTransactionAsync(async () => {
                    const txExecutor = {
                        runAsync: async (sql, params) => await db.runAsync(sql, params ?? []),
                        execAsync: async (statement) => await db.execAsync(statement),
                        getAllAsync: async (sql, params) => await db.getAllAsync(sql, params ?? []),
                        getFirstAsync: async (sql, params) => await db.getFirstAsync(sql, params ?? []),
                        query: async (sql, params) => {
                            const { sql: q, params: p } = params
                                ? namedToPositional(sql, params)
                                : { sql, params: [] };
                            return await db.getAllAsync(q, p);
                        },
                        queryOne: async (sql, params) => {
                            const { sql: q, params: p } = params
                                ? namedToPositional(sql, params)
                                : { sql, params: [] };
                            return await db.getFirstAsync(q, p);
                        },
                        execute: async (sql, params) => {
                            const { sql: q, params: p } = params
                                ? namedToPositional(sql, params)
                                : { sql, params: [] };
                            return await db.runAsync(q, p);
                        },
                    };
                    return await fn(txExecutor);
                });
            },
        };
    },
};
