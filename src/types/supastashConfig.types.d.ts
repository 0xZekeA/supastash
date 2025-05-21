type SupastashConfig = {
  dbName: string;
  supabaseClient: SupabaseClient<any, "public", any>;
  pollingInterval?: number;
  enableLogging?: boolean;
  onSchemaInit?: () => void;
  [key: string]: any;
};
