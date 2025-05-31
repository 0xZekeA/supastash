import {
  ExpoSQLiteClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
} from "@/types/supastashConfig.types";

export const SQLiteAdapterExpo: SupastashSQLiteAdapter = {
  async openDatabaseAsync(
    name: string,
    sqliteClient: ExpoSQLiteClient
  ): Promise<SupastashSQLiteDatabase> {
    const db = await sqliteClient.openDatabaseAsync(name);

    return {
      runAsync: async (sql: string, params?: any[]) => {
        await db.runAsync(sql, params ?? []);
      },

      execAsync: async (statement: string) => {
        await db.execAsync(statement);
      },

      getAllAsync: async (sql: string, params?: any[]): Promise<any[]> => {
        const result = await db.getAllAsync(sql, params ?? []);
        return result ?? [];
      },

      getFirstAsync: async (
        sql: string,
        params?: any[]
      ): Promise<any | null> => {
        const result = await db.getFirstAsync(sql, params ?? []);
        return result ?? null;
      },
    };
  },
};
