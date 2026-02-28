import { logWarn } from "../../utils/logs";
export const SQLiteAdapterNitro = {
    async openDatabaseAsync(name, sqliteClient) {
        //Enable simple null handling for Nitro SQLite
        const nitro = require("react-native-nitro-sqlite");
        if (nitro?.enableSimpleNullHandling) {
            nitro.enableSimpleNullHandling();
        }
        else {
            logWarn("[Supastash] Simple null handling is not enabled for Nitro SQLite", "Please update your react-native-nitro-sqlite version to 9.1.3 or higher");
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
            closeAsync: async () => {
                await db.close?.();
            },
            withTransaction: async (fn) => {
                await db.transaction(async (tx) => {
                    const txExecutor = {
                        runAsync: async (sql, params) => await tx.executeAsync(sql, params ?? []),
                        execAsync: async (statement) => {
                            await tx.executeAsync(statement);
                        },
                        getAllAsync: async (sql, params) => {
                            const result = await tx.executeAsync(sql, params ?? []);
                            const mainResult = result.rows?._array ?? [];
                            return mainResult;
                        },
                        getFirstAsync: async (sql, params) => {
                            const result = await tx.executeAsync(sql, params ?? []);
                            return result.rows?._array?.[0] ?? null;
                        },
                    };
                    return await fn(txExecutor);
                });
            },
        };
    },
};
