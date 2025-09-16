export type SyncResult = {
  success: string[]; // IDs that were successfully upserted
  skipped: { id: string; reason: string }[]; // IDs that were skipped with reason
};

export type TableSchema = {
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: string;
  pk: number;
};

export interface RowLike {
  id: string;
  updated_at?: string;
  created_at?: string;
  [k: string]: any;
}

export type PushFn = (payload: any) => Promise<boolean>;
export type PullFn = (payload: any) => Promise<void>;

export type SyncEntry = {
  push?: PushFn;
  pull?: PullFn;
};

export type SupastashSyncStatus = {
  table_name: string;
  filter_key: string;
  filter_json: string;
  last_created_at: string;
  last_synced_at: string;
  last_deleted_at: string;
};

export type PublicScope =
  | "all"
  | "last_synced_at"
  | "last_created_at"
  | "last_deleted_at";
