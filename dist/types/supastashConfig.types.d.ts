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

export type SupastashMode = "live" | "ghost";

export type SupastashConfig<T extends SupastashSQLiteClientTypes> = {
  // --------------------------------------------------
  // Core Database & Client Configuration
  // --------------------------------------------------

  /**
   * Name of the local SQLite database.
   */
  dbName: string;

  /**
   * Supabase client instance.
   */
  supabaseClient: SupabaseClient<any, "public", any> | null;

  /**
   * SQLite client adapter.
   */
  sqliteClient: T extends "expo"
    ? ExpoSQLiteClient
    : T extends "rn-storage"
    ? RNStorageSQLiteClient
    : T extends "rn-nitro"
    ? RNSqliteNitroClient
    : null;

  /**
   * Type of SQLite client.
   */
  sqliteClientType: T;

  // --------------------------------------------------
  // Supabase Write Batching
  // --------------------------------------------------

  /**
   * Maximum number of rows sent per Supabase write request.
   * Large payloads are automatically split into sequential batches.
   * Default: 100.
   */
  supabaseBatchSize?: number;

  // --------------------------------------------------
  // Table Inclusion / Exclusion Rules
  // --------------------------------------------------

  /**
   * Control which tables are included in pull and push sync operations.
   */
  excludeTables?: {
    pull?: string[];
    push?: string[];
  };

  // --------------------------------------------------
  // Sync Polling Intervals
  // --------------------------------------------------

  /**
   * Background sync polling intervals (in milliseconds).
   */
  pollingInterval?: {
    pull?: number;
    push?: number;
  };

  // --------------------------------------------------
  // Sync Engine Toggles & Behavior
  // --------------------------------------------------

  /**
   * High-level switches controlling sync behavior.
   */
  syncEngine?: {
    push?: boolean;
    pull?: boolean;
    useFiltersFromStore?: boolean;
  };

  // --------------------------------------------------
  // Supabase Realtime Configuration
  // --------------------------------------------------

  /**
   * Maximum number of active event listeners.
   */
  listeners?: number;

  // --------------------------------------------------
  // Schema Initialization Hook
  // --------------------------------------------------

  /**
   * Called once after local database initialization.
   * Intended for defineLocalSchema calls.
   */
  onSchemaInit?: () => Promise<void>;

  // --------------------------------------------------
  // Debugging & Diagnostics
  // --------------------------------------------------

  /**
   * Enables verbose logging for sync and database operations.
   */
  debugMode?: boolean;

  // --------------------------------------------------
  // Conflict Resolution & Retry Policy
  // --------------------------------------------------

  /**
   * Defines how Supastash classifies and handles sync conflicts.
   */
  syncPolicy?: SupastashSyncPolicy;

  // --------------------------------------------------
  // Field Validation & Auto-Fill Enforcement
  // --------------------------------------------------

  fieldEnforcement?: FieldEnforcement;

  // --------------------------------------------------
  // Conflict Cleanup Behavior
  // --------------------------------------------------

  /**
   * When true, local rows involved in non-retryable conflicts
   * will be deleted instead of retained.
   */
  deleteConflictedRows?: boolean;
  /**
   * The path to the RPC function to use for upserts.
   * If not provided, Supastash will use the default upsert logic.
   *
   * The RPC function should be defined as follows:
   * @example
   * await supabase.rpc('push_rpc_path', {
   *   target_table: 'users',
   *   payload: [{ id: '1', name: 'John Doe' }],
   *   columns: ['id', 'name'],
   * });
   *
   * ⚠️ Important:
   * Your RPC must verify data freshness before updating.
   * Always ensure local.updated_at > remote.updated_at before performing an update to prevent overwriting newer server data.
   *
   * ⚠️ Return Structure:
   * Your RPC must return an array of objects with the following shape:
   *
   * {
   *   id: string;             // UUID of the row
   *   action: "updated" | "inserted" | "skipped";
   *   reason?: string | null; // Optional reason, e.g. "stale_remote", "conflict_or_unauthorized"
   *   record_exists: boolean;        // Whether the row already exists remotely
   * }
   *
   * Supastash uses this structure to reconcile local states and decide whether to retry, re-insert, or refresh each row.
   * It's advisable to use the recommended structure from the docs: https://0xzekea.github.io/supastash/docs/sync-calls#%EF%B8%8F-pushrpcpath-custom-batch-sync-rpc
   *
   * @example
   * Supastash docs: https://0xzekea.github.io/supastash/docs/sync-calls#%EF%B8%8F-pushrpcpath-custom-batch-sync-rpc
   */
  pushRPCPath?: string;
  /**
   * Controls how Supastash operates at runtime.
   *
   * - "live":
   *   Supastash runs in normal production mode.
   *   Local changes are synchronized with the remote server,
   *   including pull, push, realtime subscriptions, and background retries.
   *
   * - "ghost":
   *   Supastash runs in isolated, local-only mode.
   *   All network activity is completely disabled:
   *   - no server sync (pull or push)
   *   - no realtime subscriptions
   *   - no background jobs or retry loops
   *   - no Supabase client initialization
   *
   *   Data is stored in a separate local database using the same schema
   *   and business logic, but is never synchronized or persisted remotely.
   *
   * This mode is intended for demo, training, testing, or sandbox environments
   * where data isolation and zero network access are required.
   *
   * Default: "live".
   */
  supastashMode?: SupastashMode;
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
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Executes a query and returns **only the first row** (or `null` if no rows).
   *
   * @param sql - The SQL query to execute
   * @param params - Optional parameters for the query
   * @returns A Promise resolving to the first matching row
   */
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Executes **multiple SQL statements** separated by semicolons.
   * Useful for bulk table creation or schema migrations.
   *
   * @param statements - SQL string containing multiple statements
   * @returns A Promise that resolves when all statements are executed
   */
  execAsync(statements: string): Promise<void>;

  /**
   * Closes the underlying SQLite connection.
   *
   * ⚠️ Internal / advanced use only.
   * This is primarily used by Supastash during re-initialization
   * (user switch, shop switch, mode change).
   *
   * Do NOT call this in production app code.
   */
  closeAsync(): Promise<void>;
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

/**
 * Supastash Sync Policy
 *
 * Controls how Supastash resolves remote vs local conflicts, how long to retry
 * transient errors, and how to handle rows blocked by missing parents (FK).
 *
 * ### Default behavior
 * - **Server-wins** on conflicts: if Supabase already has a newer or conflicting row,
 *   Supastash accepts the server copy and marks the local row as synced.
 * - **Transient errors** are retried with exponential backoff for up to 20 minutes.
 * - **Foreign key errors** (missing parent rows) are retried for up to 24 hours.
 *
 * ### Example
 * ```ts
 * configureSupastash({
 *   syncPolicy: {
 *     onNonRetryable: 'delete-local',    // hard delete rows that conflict
 *     maxTransientMs: 10 * 60 * 1000,    // retry transient errors for 10 minutes
 *     maxFkBlockMs: 48 * 60 * 60 * 1000, // retry FK errors for 48 hours
 *   }
 * })
 * ```
 */
export interface SupastashSyncPolicy {
  /**
   * Override the set of Postgres error codes Supastash treats as non-retryable.
   * These usually mean there is a **real conflict** on the server and retrying
   * will never succeed.
   *
   * Defaults: 23505 (unique), 23502 (not null), 23514 (check), 23P01 (exclusion).
   */
  nonRetryableCodes?: Set<string>;

  /**
   * Override the set of Postgres error codes Supastash treats as retryable.
   * These are transient concurrency issues (e.g., serialization, deadlocks).
   *
   * Defaults: 40001, 40P01, 55P03.
   */
  retryableCodes?: Set<string>;

  /**
   * The Postgres error code for foreign key violations.
   * Defaults: '23503'.
   */
  fkCode?: string;

  /**
   * Action to take when Supastash hits a non-retryable conflict.
   * - 'accept-server' (default): keep the server row, mark local as synced.
   * - 'delete-local': remove the local row entirely.
   */
  onNonRetryable?: "accept-server" | "delete-local";

  /**
   * How long to retry transient errors (ms).
   * Default: 20 minutes.
   */
  maxTransientMs?: number;

  /**
   * How long to keep retrying rows blocked by missing parents (FK errors).
   * Default: 24 hours.
   */
  maxFkBlockMs?: number;

  /**
   * Backoff schedule (in ms) for retry attempts.
   * Default: [10_000, 30_000, 120_000, 300_000, 600_000].
   */
  backoffDelaysMs?: number[];

  /**
   * Maximum number of attempts for a batch before falling back
   * to per-row handling. Default: 5.
   */
  maxBatchAttempts?: number;

  /**
   * Optional hook: ensure that parent rows exist before pushing children.
   * Return 'blocked' to skip this child until the parent exists.
   */
  ensureParents?: (table: string, row: any) => Promise<"ok" | "blocked">;

  /**
   * Optional callback fired when Supastash accepts the server row
   * instead of retrying. Useful for analytics/telemetry.
   */
  onRowAcceptedServer?: (table: string, id: string) => void;

  /**
   * Optional callback fired when Supastash deletes a local row
   * due to a non-retryable conflict.
   */
  onRowDroppedLocal?: (table: string, id: string) => void;
}

/**
 * Field Enforcement
 *
 * Supastash **requires** `created_at` and `updated_at` timestamps on every table
 * for reliable sync. This config makes those rules explicit and lets you adjust
 * field names and defaults.
 *
 * ### Default behavior
 * - Enforce both `created_at` and `updated_at`.
 * - Auto-fill missing fields with `'1970-01-01T00:00:00Z'`.
 *
 * ### Example
 * ```ts
 * configureSupastash({
 *   fieldEnforcement: {
 *     createdAtField: 'created',
 *     updatedAtField: 'modified',
 *     autoFillMissing: false, // throw instead of filling
 *   }
 * })
 * ```
 */
export interface FieldEnforcement {
  /**
   * Whether Supastash should enforce a `created_at` column.
   * Default: true.
   */
  requireCreatedAt?: boolean;

  /**
   * Whether Supastash should enforce an `updated_at` column.
   * Default: true.
   */
  requireUpdatedAt?: boolean;

  /**
   * Name of the column to use for `created_at`.
   * Default: 'created_at'.
   */
  createdAtField?: string;

  /**
   * Name of the column to use for `updated_at`.
   * Default: 'updated_at'.
   */
  updatedAtField?: string;

  /**
   * Whether Supastash should automatically fill in missing timestamps
   * with a default ISO string. Default: true.
   */
  autoFillMissing?: boolean;

  /**
   * Default ISO string to use when auto-filling missing timestamps.
   * Default: '1970-01-01T00:00:00Z'.
   */
  autoFillDefaultISO?: string;
}
