import { SupabaseClient } from "@supabase/supabase-js";
import { ExpoSQLiteDatabase } from "./expoSqlite.types";
import { RNNitroSQLiteDatabase } from "./rnNitroSqlite.types";
import { RNStorageSQLiteDatabase } from "./rnSqliteStorage.types";

export type SupastashSQLiteClientTypes =
  | "expo"
  | "rn-storage"
  | "rn-nitro"
  | null;

export type SupastashConfig<T extends SupastashSQLiteClientTypes> = {
  dbName: string;
  supabaseClient: SupabaseClient<any, "public", any> | null;
  sqliteClient: T extends "expo"
    ? ExpoSQLiteClient
    : T extends "rn-storage"
    ? RNStorageSQLiteClient
    : T extends "rn-nitro"
    ? RNSqliteNitroClient
    : null;
  sqliteClientType: T;
  excludeTables?: { pull?: string[]; push?: string[] };
  pollingInterval?: {
    pull?: number;
    push?: number;
  };
  syncEngine?: {
    push?: boolean;
    pull?: boolean;
    useFiltersFromStore?: boolean;
  };
  listeners?: number;
  onSchemaInit?: () => Promise<void>;
  debugMode?: boolean;
};

interface SupastashSQLiteDatabase {
  runAsync(sql: string, params?: any[]): Promise<void>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execAsync(statements: string): Promise<void>;
}

export interface SupastashSQLiteAdapter {
  openDatabaseAsync(
    name: string,
    sqliteClient: ExpoSQLiteClient | RNStorageSQLiteClient | RNSqliteNitroClient
  ): Promise<SupastashSQLiteDatabase>;
}

export interface ExpoSQLiteClient {
  openDatabaseAsync: (
    databaseName: string,
    options?: SQLiteOpenOptions | undefined,
    directory?: string | undefined
  ) => Promise<ExpoSQLiteDatabase>;
}

export interface RNStorageSQLiteClient {
  openDatabase: ({
    name,
  }: {
    name: string;
  }) => Promise<RNStorageSQLiteDatabase>;
}

export interface RNSqliteNitroClient {
  open: (options: { name: string; location?: string }) => RNNitroSQLiteDatabase;
}

export interface SupastashHookReturn {
  dbReady: boolean;
  startSync: () => void;
  stopSync: () => void;
}
