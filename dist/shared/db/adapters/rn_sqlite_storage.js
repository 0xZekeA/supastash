import { namedToPositional } from "../normalizer";
export const SQLiteAdapterStorage = {
    async openDatabaseAsync(name, sqliteClient) {
        const db = await sqliteClient.openDatabase({ name });
        return {
            runAsync: async (sql, params) => {
                await db.executeSql(sql, params ?? []);
            },
            execAsync: async (statement) => {
                await db.executeSql(statement);
            },
            getAllAsync: async (sql, params) => {
                const result = await db.executeSql(sql, params ?? []);
                const mainResult = result.map((r, index) => r.rows.item(index));
                return mainResult ?? [];
            },
            getFirstAsync: async (sql, params) => {
                const result = await db.executeSql(sql, params ?? []);
                return result[0].rows.item(0) ?? null;
            },
            query: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                const result = await db.executeSql(q, p ?? []);
                return result.map((r, index) => r.rows.item(index));
            },
            queryOne: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                const result = await db.executeSql(q, p ?? []);
                return result[0].rows.item(0) ?? null;
            },
            execute: async (sql, params) => {
                const { sql: q, params: p } = params
                    ? namedToPositional(sql, params)
                    : { sql, params: [] };
                await db.executeSql(q, p ?? []);
            },
            closeAsync: async () => {
                await db.close?.();
            },
            withTransaction: async (fn) => {
                await db.transaction(async (tx) => {
                    const txExecutor = {
                        runAsync: async (sql, params) => {
                            await tx.executeSql(sql, params ?? []);
                        },
                        execAsync: async (statement) => {
                            await tx.executeSql(statement);
                        },
                        getAllAsync: async (sql, params) => {
                            const [, resultSet] = await tx.executeSql(sql, params ?? []);
                            const rows = [];
                            for (let i = 0; i < resultSet.rows.length; i++) {
                                rows.push(resultSet.rows.item(i));
                            }
                            return rows;
                        },
                        getFirstAsync: async (sql, params) => {
                            const [, resultSet] = await tx.executeSql(sql, params ?? []);
                            if (resultSet.rows.length === 0)
                                return null;
                            return resultSet.rows.item(0);
                        },
                        query: async (sql, params) => {
                            const { sql: q, params: p } = params
                                ? namedToPositional(sql, params)
                                : { sql, params: [] };
                            const result = await db.executeSql(q, p ?? []);
                            return result.map((r, index) => r.rows.item(index));
                        },
                        queryOne: async (sql, params) => {
                            const { sql: q, params: p } = params
                                ? namedToPositional(sql, params)
                                : { sql, params: [] };
                            const result = await db.executeSql(q, p ?? []);
                            return result[0].rows.item(0) ?? null;
                        },
                        execute: async (sql, params) => {
                            const { sql: q, params: p } = params
                                ? namedToPositional(sql, params)
                                : { sql, params: [] };
                            await db.executeSql(q, p ?? []);
                        },
                    };
                    return await fn(txExecutor);
                });
            },
        };
    },
};
