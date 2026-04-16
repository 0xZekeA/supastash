import { PayloadData } from "./query.types";
import { SupastashFilter } from "./realtimeData.types";
import { SupastashSQLiteExecutor } from "./supastashConfig.types";

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
  last_synced_at: string;
  last_synced_at_pk: string | null;
  last_deleted_at: string | null;
};

export type PublicScope = "all" | "last_synced_at" | "last_deleted_at";

export type CurrentTableInfo = {
  /** Table currently being synced */
  name: string;

  /** Number of local records pending upload or download */
  unsyncedDataCount: number;

  /** Number of soft-deleted records pending sync */
  unsyncedDeletedCount: number;
};

export type SyncLogEntry = {
  /** Table this log entry belongs to */
  table: string;

  /** Optional filter key used for pull operations */
  filterKey?: string;

  /** JSON array of filters used for pull operations */
  filterJson?: SupastashFilter[];

  /** Sync direction for this log entry ("push" or "pull") */
  action: "push" | "pull";

  /** Whether the sync operation completed successfully */
  success: boolean;

  /** Number of errors encountered during the operation */
  errorCount: number;

  /** Last recorded error (if any) */
  lastError: Error | null;

  /** Number of unsynced data rows before this operation */
  unsyncedDataCount: number;

  /** Number of unsynced deleted rows before this operation */
  unsyncedDeletedCount: number;

  /** Timestamp (ms) when the operation started */
  startTime: number;

  /** Timestamp (ms) when the operation ended */
  endTime: number;

  /** Number of rows that failed to push (push only) */
  rowsFailed: number;
};

export type SyncInfoItem = {
  /** Whether a sync process is currently active */
  inProgress: boolean;

  /** Total number of tables scheduled for this sync cycle */
  numberOfTables: number;

  /** Number of tables successfully completed so far */
  tablesCompleted: number;

  /** Details of the table currently being processed */
  currentTable: CurrentTableInfo;

  /** Timestamp (ms) of the most recent completed sync */
  lastSyncedAt: number;

  /** Collection of detailed logs for recent table syncs */
  lastSyncLog: SyncLogEntry[];
};

export type SyncInfo = {
  /** Sync information for pull operations (server → local) */
  pull: SyncInfoItem;

  /** Sync information for push operations (local → server) */
  push: SyncInfoItem;
};

export type ReceivedDataCompleted = {
  completed: boolean;
  lastTimestamp: string | undefined;
  lastId: string | undefined;
};
export type ReceivedDataCompletedMap = {
  [key: string]: {
    arrived_at: ReceivedDataCompleted;
    updated_at: ReceivedDataCompleted;
  };
};

export type UpsertDataParams = {
  /**
   * Optional transaction executor.
   *
   * If provided, the upsert will execute within this existing transaction.
   * This is typically supplied when called inside
   * `db.withTransaction(...)` or `supastash.withTransaction(...)`.
   *
   * If omitted, the upsert will run using the root database executor.
   */
  tx?: SupastashSQLiteExecutor;

  /**
   * The table to perform the upsert on.
   */
  table: string;

  /**
   * The record to insert or update.
   */
  record: PayloadData | PayloadData[];

  /**
   * Optional optimization hint.
   *
   * If true, forces UPDATE.
   * If false, forces INSERT.
   * If undefined, existence will be determined automatically.
   */
  doesExist?: boolean;
};
