import { getSupastashConfig } from "../../core/config";
import {
  RNSqliteNitroClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
  SupastashSQLiteExecutor,
} from "../../types/supastashConfig.types";
import { isDebugMode } from "../../utils/logs";
import { namedToPositional } from "../normalizer";

export const SQLiteAdapterNitro: SupastashSQLiteAdapter<RNSqliteNitroClient> = {
  async openDatabaseAsync(
    name: string,
    sqliteClient: RNSqliteNitroClient
  ): Promise<SupastashSQLiteDatabase> {
    //Enable simple null handling for Nitro SQLite
    const config = getSupastashConfig();
    if (!config.hasEnabledSimpleNullHandling && isDebugMode()) {
      console.warn(
        "[Supastash] Nitro SQLite detected. Call `enableSimpleNullHandling()` at the top of your app to ensure correct null behavior (see: https://libraries.io/npm/@vertexmd%2Freact-native-nitro-sqlite#simplified-null-handling). If already enabled, set `hasEnabledSimpleNullHandling: true` in Supastash config to silence this warning."
      );
    }
    const db = await sqliteClient.open({ name, location: "default" });

    return {
      runAsync: async (sql: string, params?: any[]) => {
        await db.executeAsync(sql, params ?? []);
      },

      execAsync: async (statement: string) => {
        await db.executeAsync(statement);
      },

      getAllAsync: async (sql: string, params?: any[]): Promise<any[]> => {
        const result = await db.executeAsync(sql, params ?? []);
        const mainResult = result.rows?._array ?? [];
        return mainResult;
      },

      getFirstAsync: async (
        sql: string,
        params?: any[]
      ): Promise<any | null> => {
        const result = await db.executeAsync(sql, params ?? []);
        return result.rows?._array?.[0] ?? null;
      },

      query: async (
        sql: string,
        params?: Record<string, any>
      ): Promise<any[]> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        const result = await db.executeAsync(q, p ?? []);
        const mainResult = result.rows?._array ?? [];
        return mainResult;
      },

      queryOne: async (
        sql: string,
        params?: Record<string, any>
      ): Promise<any | null> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        const result = await db.executeAsync(q, p ?? []);
        return result.rows?._array?.[0] ?? null;
      },

      execute: async (
        sql: string,
        params?: Record<string, any>
      ): Promise<any> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        return await db.executeAsync(q, p ?? []);
      },

      closeAsync: async () => {
        await db.close?.();
      },

      withTransaction: async (
        fn: (tx: SupastashSQLiteExecutor) => Promise<void> | void
      ): Promise<void> => {
        await db.transaction(async (tx) => {
          const txExecutor: SupastashSQLiteExecutor = {
            runAsync: async (sql: string, params?: any[]) =>
              await tx.executeAsync(sql, params ?? []),
            execAsync: async (statement: string) => {
              await tx.executeAsync(statement);
            },
            getAllAsync: async (
              sql: string,
              params?: any[]
            ): Promise<any[]> => {
              const result = await tx.executeAsync(sql, params ?? []);
              const mainResult = result.rows?._array ?? [];
              return mainResult;
            },
            getFirstAsync: async (
              sql: string,
              params?: any[]
            ): Promise<any | null> => {
              const result = await tx.executeAsync(sql, params ?? []);
              return result.rows?._array?.[0] ?? null;
            },
            query: async (
              sql: string,
              params?: Record<string, any>
            ): Promise<any[]> => {
              const { sql: q, params: p } = params
                ? namedToPositional(sql, params)
                : { sql, params: [] };
              const result = await db.executeAsync(q, p ?? []);
              const mainResult = result.rows?._array ?? [];
              return mainResult;
            },

            queryOne: async (
              sql: string,
              params?: Record<string, any>
            ): Promise<any | null> => {
              const { sql: q, params: p } = params
                ? namedToPositional(sql, params)
                : { sql, params: [] };
              const result = await db.executeAsync(q, p ?? []);
              return result.rows?._array?.[0] ?? null;
            },

            execute: async (
              sql: string,
              params?: Record<string, any>
            ): Promise<any> => {
              const { sql: q, params: p } = params
                ? namedToPositional(sql, params)
                : { sql, params: [] };
              return await db.executeAsync(q, p ?? []);
            },
          };
          return await fn(txExecutor);
        });
      },
    };
  },
};
