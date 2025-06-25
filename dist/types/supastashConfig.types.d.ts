import { SupabaseClient } from "@supabase/supabase-js";
import { SQLiteOpenOptions } from "expo-sqlite";
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
  /**
   * Executes a SQL statement without returning any result.
   * Useful for `INSERT`, `UPDATE`, `DELETE`, or `CREATE TABLE` commands.
   *
   * @param sql - The SQL statement to run
   * @param params - Optional parameters for the statement
   * @returns A Promise that resolves when the execution is complete
   */
  runAsync(sql: string, params?: any[]): Promise<void>;

  /**
   * Executes a query and returns **all rows** as an array.
   *
   * @param sql - The SQL query to execute
   * @param params - Optional parameters for the query
   * @returns A Promise resolving to an array
   */
  getAllAsync(sql: string, params?: any[]): Promise<any[]>;

  /**
   * Executes a query and returns **only the first row** (or `null` if no rows).
   *
   * @param sql - The SQL query to execute
   * @param params - Optional parameters for the query
   * @returns A Promise resolving to the first matching row
   */
  getFirstAsync(sql: string, params?: any[]): Promise<any | null>;

  /**
   * Executes **multiple SQL statements** separated by semicolons.
   * Useful for bulk table creation or schema migrations.
   *
   * @param statements - SQL string containing multiple statements
   * @returns A Promise that resolves when all statements are executed
   */
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
