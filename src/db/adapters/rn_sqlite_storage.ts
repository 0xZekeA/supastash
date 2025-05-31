import {
  RNStorageSQLiteClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
} from "@/types/supastashConfig.types";

export const SQLiteAdapterStorage: SupastashSQLiteAdapter = {
  async openDatabaseAsync(
    name: string,
    sqliteClient: RNStorageSQLiteClient
  ): Promise<SupastashSQLiteDatabase> {
    const db = await sqliteClient.openDatabase({ name });

    return {
      runAsync: async (sql: string, params?: any[]) => {
        await db.executeSql(sql, params ?? []);
      },

      execAsync: async (statement: string) => {
        await db.executeSql(statement);
      },

      getAllAsync: async (sql: string, params?: any[]): Promise<any[]> => {
        const result = await db.executeSql(sql, params ?? []);
        const mainResult = result.map((r, index) => r.rows.item(index));
        return mainResult ?? [];
      },

      getFirstAsync: async (
        sql: string,
        params?: any[]
      ): Promise<any | null> => {
        const result = await db.executeSql(sql, params ?? []);
        return result[0].rows.item(0) ?? null;
      },
    };
  },
};
