import {
  SupastashConfig,
  SupastashSQLiteClientTypes,
} from "@/types/supastashConfig.types";

let _config: SupastashConfig<SupastashSQLiteClientTypes> = {
  dbName: "supastash_db",
  supabaseClient: null,
  sqliteClient: null,
  sqliteClientType: null,
  excludeTables: { pull: [], push: [] },
  pollingInterval: {
    pull: 30000,
    push: 30000,
  },
  listeners: 250,
  debugMode: false,
};

let _configured = false;

/**
 * Configures the Supastash client.
 *
 * This function **must be called once** during app initialization (e.g., in `App.tsx` or `_layout.tsx`)
 * before using any Supastash hooks or accessing the Supastash client.
 *
 * @example
 * ```ts
 * import { openDatabaseAsync } from "expo-sqlite";
 * import { configureSupastash } from "@/lib/supastash/config";
 *
 * configureSupastash({
 *   dbName: "supastash_db",
 *   supabaseClient: supabase,
 *   sqliteClient: { openDatabaseAsync }, // Provide the correct SQLite client
 *   sqliteClientType: "expo",
 *   onSchemaInit: () => {
 *     defineLocalSchema("users", {
 *       id: "TEXT PRIMARY KEY",
 *       name: "TEXT",
 *       email: "TEXT",
 *       created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
 *       updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
 *     });
 *   },
 * });
 * ```
 *
 * @param config - Configuration options
 * @param config.dbName - SQLite database name (default: `"supastash_db"`)
 * @param config.supabaseClient - Supabase client instance (**required**)
 * @param config.sqliteClient - SQLite client instance (**required**)
 * @param config.sqliteClientType - SQLite engine type: `"expo" | "rn-storage" | "rn-nitro"` (**required**)
 * @param config.onSchemaInit - Optional callback to define your local SQLite schema
 * @param config.debugMode - Enable debug logs (default: `false`)
 * @param config.listeners - Max event listeners for subscriptions (default: `250`)
 * @param config.excludeTables - Tables to exclude from syncing (default: `{ pull: [], push: [] }`)
 * @param config.pollingInterval - Polling intervals for pull/push sync (default: `{ pull: 30000, push: 30000 }`)
 */
function configureSupastash<T extends SupastashSQLiteClientTypes>(
  config: Partial<SupastashConfig<T>>
) {
  _config = {
    ..._config,
    ...(config as Partial<SupastashConfig<T> & { sqliteClientType: T }>),
  };
  _configured = true;
}

/**
 * Returns the current Supastash configuration.
 *
 * Throws an error if `configureSupastash` has not been called.
 *
 * @returns {SupastashConfig<T>} The active Supastash configuration
 *
 * @throws Will throw if Supastash is not configured or if essential values like
 * `supabaseClient` or `sqliteClient` are missing.
 *
 * @example
 * const config = getSupastashConfig();
 * const dbName = config.dbName;
 */
export function getSupastashConfig<
  T extends SupastashSQLiteClientTypes
>(): SupastashConfig<T> {
  if (!_configured) {
    throw new Error(
      "[Supastash] Missing configuration. You must call `configureSupastash()` before using Supastash hooks.\n\nAdd an import to your setup file:\n\nimport '@/lib/supastash/supastashSetup';"
    );
  }

  if (!_config.supabaseClient || !_config.sqliteClient) {
    throw new Error(
      "[Supastash] Configuration incomplete. `supabaseClient` and `sqliteClient` must be set."
    );
  }
  return _config as SupastashConfig<T>;
}

/**
 * Wrapper for `configureSupastash` that takes a strongly typed object containing
 * the Supastash config, including optional schema initialization.
 *
 * Useful for abstracting config logic into a central setup file.
 *
 * @param config.dbOptions - The Supastash configuration object
 * @param config.dbOptions.onSchemaInit - Optional callback to define the local schema
 *
 * @example
 * defineSupastashConfig({
 *   dbOptions: {
 *     dbName: "supastash_db",
 *     supabaseClient,
 *     sqliteClient,
 *     sqliteClientType: "expo",
 *     onSchemaInit: () => {
 *       defineLocalSchema("orders", { id: "TEXT PRIMARY KEY", status: "TEXT" });
 *     },
 *   },
 * });
 */
export function defineSupastashConfig<
  T extends SupastashSQLiteClientTypes
>(config: {
  dbOptions: Partial<SupastashConfig<T>> & {
    onSchemaInit?: () => void;
  };
}) {
  configureSupastash(config.dbOptions);
}
