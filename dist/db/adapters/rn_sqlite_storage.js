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
        };
    },
};
