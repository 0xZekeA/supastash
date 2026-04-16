import {
  ExpoSQLiteClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
  SupastashSQLiteExecutor,
} from "../../types/supastashConfig.types";
import { namedToPositional } from "../normalizer";

export const SQLiteAdapterExpo: SupastashSQLiteAdapter<ExpoSQLiteClient> = {
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

      query: async (
        sql: string,
        params?: Record<string, any>
      ): Promise<any[]> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        return await db.getAllAsync(q, p);
      },

      queryOne: async (
        sql: string,
        params?: Record<string, any>
      ): Promise<any | null> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        return await db.getFirstAsync(q, p);
      },

      execute: async (
        sql: string,
        params?: Record<string, any>
      ): Promise<any> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        return await db.runAsync(q, p);
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
            query: async <R = any>(
              sql: string,
              params?: Record<string, any>
            ) => {
              const { sql: q, params: p } = params
                ? namedToPositional(sql, params)
                : { sql, params: [] };
              return await db.getAllAsync<R>(q, p);
            },
            queryOne: async <R = any>(
              sql: string,
              params?: Record<string, any>
            ) => {
              const { sql: q, params: p } = params
                ? namedToPositional(sql, params)
                : { sql, params: [] };
              return await db.getFirstAsync<R>(q, p);
            },
            execute: async <R = any>(
              sql: string,
              params?: Record<string, any>
            ) => {
              const { sql: q, params: p } = params
                ? namedToPositional(sql, params)
                : { sql, params: [] };
              return await db.runAsync<R>(q, p);
            },
          };

          return await fn(txExecutor);
        });
      },
    };
  },
};
