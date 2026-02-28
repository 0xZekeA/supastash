import {
  ExpoSQLiteClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
  SupastashSQLiteExecutor,
} from "../../types/supastashConfig.types";

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

      closeAsync: async () => {
        await db.closeAsync?.();
      },

      withTransaction: async (
        fn: (tx: SupastashSQLiteExecutor) => Promise<void> | void
      ): Promise<void> => {
        return await db.withTransactionAsync(async () => {
          const txExecutor: SupastashSQLiteExecutor = {
            runAsync: async <R = any>(sql: string, params?: any[]) =>
              await db.runAsync<R>(sql, params ?? []),
            execAsync: async (statement) => await db.execAsync(statement),
            getAllAsync: async <R = any>(sql: string, params?: any[]) =>
              await db.getAllAsync<R>(sql, params ?? []),
            getFirstAsync: async <R = any>(sql: string, params?: any[]) =>
              await db.getFirstAsync<R>(sql, params ?? []),
          };

          return await fn(txExecutor);
        });
      },
    };
  },
};
