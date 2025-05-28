let _config: SupastashConfig = {
  dbName: "supastash_db",
  pollingInterval: 30000,
  enableLogging: false,
  supabaseClient: null,
};

/**
 * Configures the supastash client
 * @param config - The config to configure
 */
function configureSupastash(config: Partial<SupastashConfig>) {
  _config = {
    ..._config,
    ...config,
  };
}

/**
 * Gets the supastash config
 * @returns The supastash config
 */
export function getSupastashConfig(): SupastashConfig {
  return _config;
}

/**
 * Defines the supastash config
 * @param config - The config to define
 */
export function defineSupastashConfig(config: {
  dbOptions: Partial<SupastashConfig> & {
    onSchemaInit?: () => void;
  };
}) {
  configureSupastash(config.dbOptions);
}
