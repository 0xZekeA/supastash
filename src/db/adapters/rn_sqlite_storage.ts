import {
  RNStorageSQLiteClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
  SupastashSQLiteExecutor,
} from "../../types/supastashConfig.types";

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

      closeAsync: async () => {
        await db.close?.();
      },

      withTransaction: async (
        fn: (tx: SupastashSQLiteExecutor) => Promise<void> | void
      ): Promise<void> => {
        await db.transaction(async (tx) => {
          const txExecutor: SupastashSQLiteExecutor = {
            runAsync: async (sql: string, params?: any[]) => {
              await tx.executeSql(sql, params ?? []);
            },

            execAsync: async (statement: string) => {
              await tx.executeSql(statement);
            },

            getAllAsync: async <T = any>(
              sql: string,
              params?: any[]
            ): Promise<T[]> => {
              const [, resultSet] = await tx.executeSql(sql, params ?? []);

              const rows: T[] = [];

              for (let i = 0; i < resultSet.rows.length; i++) {
                rows.push(resultSet.rows.item(i));
              }

              return rows;
            },

            getFirstAsync: async <T = any>(
              sql: string,
              params?: any[]
            ): Promise<T | null> => {
              const [, resultSet] = await tx.executeSql(sql, params ?? []);

              if (resultSet.rows.length === 0) return null;

              return resultSet.rows.item(0);
            },
          };

          return await fn(txExecutor);
        });
      },
    };
  },
};
