export const SQLiteAdapterNitro = {
    async openDatabaseAsync(name, sqliteClient) {
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
        };
    },
};
