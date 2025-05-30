type SyncResult = {
  success: string[]; // IDs that were successfully upserted
  skipped: { id: string; reason: string }[]; // IDs that were skipped with reason
};

type TableSchema = {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: string;
  pk: number;
};
