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
        };
    },
};
