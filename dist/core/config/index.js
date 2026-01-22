import { DEFAULT_FIELDS, DEFAULT_POLICY } from "../../constants/syncDefaults";
let _config = {
    dbName: "supastash_db",
    supabaseClient: null,
    sqliteClient: null,
    sqliteClientType: null,
    excludeTables: { pull: [], push: [] },
    pollingInterval: {
        pull: 30000,
        push: 30000,
    },
    syncEngine: {
        push: true,
        pull: true,
        useFiltersFromStore: true,
    },
    listeners: 250,
    debugMode: true,
    syncPolicy: DEFAULT_POLICY,
    fieldEnforcement: DEFAULT_FIELDS,
    deleteConflictedRows: false,
    pushRPCPath: undefined,
    supastashMode: "live",
};
let _configured = false;
/**
 * Initializes the Supastash client.
 *
 * This must be called **once** during app startup (e.g., in `_layout.tsx` or `App.tsx`)
 * before using any Supastash hooks or features.
 *
 * ⚠️ Pull sync is **disabled by default** to avoid unfiltered data fetches.
 * Enable it only if you've configured **Row Level Security (RLS)** on your Supabase tables.
 * The `useSupatashData` hook always performs filtered pull queries when `filter` is provided in the `options`, making it safe to use even when pull is disabled globally.
 *
 * @example
 * import { supabase } from "./supabase";
 * import { openDatabaseAsync } from "expo-sqlite";
 * import { configureSupastash, defineLocalSchema } from "supastash";
 *
 * configureSupastash({
 *   dbName: "supastash_db",
 *   supabaseClient: supabase,
 *   sqliteClient: { openDatabaseAsync },
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
 *
 * @param config - Configuration options for Supastash
 * @param config.dbName - SQLite database name (default: `"supastash_db"`)
 * @param config.supabaseClient - Supabase client instance (**required**)
 * @param config.sqliteClient - SQLite client adapter (**required**)
 * @param config.sqliteClientType - SQLite engine: `"expo" | "rn-storage" | "rn-nitro"` (**required**)
 * @param config.onSchemaInit - Optional callback to define local table schemas
 * @param config.debugMode - Enables debug logging (default: `false`)
 * @param config.listeners - Max number of active Realtime subscriptions (default: `250`)
 * @param config.excludeTables - Tables to exclude from sync (default: `{ pull: [], push: [] }`)
 * @param config.pollingInterval - Polling interval for sync (default: `{ pull: 30000, push: 30000 }`)
 * @param config.syncEngine - Control pull/push sync behavior (`push: true`, `pull: false` by default, `useFiltersFromStore: true` by default)
 * @param config.syncPolicy - Control how Supastash resolves remote vs local conflicts, how long to retry transient errors, and how to handle rows blocked by missing parents (FK)
 * @param config.supastashMode - Controls how Supastash operates at runtime.
 *   - "live": Supastash runs in normal production mode.
 *   - "ghost": Supastash runs in isolated, local-only mode.
 * Default: "live".
 */
export function configureSupastash(config) {
    _config = {
        ..._config,
        ...config,
        syncEngine: {
            ..._config.syncEngine,
            ...config.syncEngine,
        },
        excludeTables: {
            pull: config.excludeTables?.pull ?? _config.excludeTables?.pull ?? [],
            push: config.excludeTables?.push ?? _config.excludeTables?.push ?? [],
        },
        pollingInterval: {
            pull: config.pollingInterval?.pull ?? _config.pollingInterval?.pull ?? 30000,
            push: config.pollingInterval?.push ?? _config.pollingInterval?.push ?? 30000,
        },
        syncPolicy: {
            ...DEFAULT_POLICY,
            ..._config.syncPolicy,
            ...config.syncPolicy,
            nonRetryableCodes: config.syncPolicy?.nonRetryableCodes ??
                _config.syncPolicy?.nonRetryableCodes ??
                DEFAULT_POLICY.nonRetryableCodes,
            retryableCodes: config.syncPolicy?.retryableCodes ??
                _config.syncPolicy?.retryableCodes ??
                DEFAULT_POLICY.retryableCodes,
        },
        fieldEnforcement: {
            ...DEFAULT_FIELDS,
            ..._config.fieldEnforcement,
            ...config.fieldEnforcement,
        },
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
export function getSupastashConfig() {
    return _config;
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
export function defineSupastashConfig(config) {
    configureSupastash(config.dbOptions);
}
