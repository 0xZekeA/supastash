import { enableSimpleNullHandling } from "react-native-nitro-sqlite";
import {
  RNSqliteNitroClient,
  SupastashSQLiteAdapter,
  SupastashSQLiteDatabase,
} from "../../types/supastashConfig.types";
import { logWarn } from "../../utils/logs";

export const SQLiteAdapterNitro: SupastashSQLiteAdapter = {
  async openDatabaseAsync(
    name: string,
    sqliteClient: RNSqliteNitroClient
  ): Promise<SupastashSQLiteDatabase> {
    //Enable simple null handling for Nitro SQLite
    if (enableSimpleNullHandling) {
      enableSimpleNullHandling();
    } else {
      logWarn(
        "[Supastash] Simple null handling is not enabled for Nitro SQLite",
        "Please update your react-native-nitro-sqlite version to 9.1.3 or higher"
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
    };
  },
};
