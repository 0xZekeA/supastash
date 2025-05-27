let _config: SupastashConfig = {
  dbName: "supastash_db",
  pollingInterval: 30000,
  enableLogging: false,
  supabaseClient: null,
};

function configureSupastash(config: Partial<SupastashConfig>) {
  _config = {
    ..._config,
    ...config,
  };
}

// Get the current config
export function getSupastashConfig(): SupastashConfig {
  return _config;
}

// Define the config
export function defineSupastashConfig(config: {
  dbOptions: Partial<SupastashConfig> & {
    onSchemaInit?: () => void;
  };
}) {
  configureSupastash(config.dbOptions);
}
