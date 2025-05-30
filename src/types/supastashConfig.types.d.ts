type SupastashConfig = {
  dbName: string;
  supabaseClient: SupabaseClient<any, "public", any>;
  excludeTables: { pull: string[]; push: string[] };
  pollingInterval: {
    pull: number;
    push: number;
  };
  listeners: number;
  onSchemaInit?: () => void;
  debugMode?: boolean;
  [key: string]: any;
};
