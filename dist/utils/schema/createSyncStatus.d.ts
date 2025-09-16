/**
 * Creates the supastash_deleted_status table if it doesn't exist
 *
 * Deprecated table for deleted status
 * @deprecated Use createSyncStatusTable instead
 */
export declare function createDeletedStatusTable(): Promise<void>;
export declare const SYNC_STATUS_TABLES_SQL = "\n  CREATE TABLE IF NOT EXISTS supastash_sync_marks (\n  table_name       TEXT NOT NULL,\n  filter_key       TEXT NOT NULL,         \n  filter_json      TEXT NULL,             \n  last_created_at  TEXT NULL,             \n  last_synced_at   TEXT NULL,             \n  last_deleted_at  TEXT NULL,             \n  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),\n  PRIMARY KEY (table_name, filter_key)\n);";
export declare const INDEX_SYNC_MARKS_SQL = "\n  CREATE INDEX IF NOT EXISTS idx_supastash_marks_updated\n    ON supastash_sync_marks(updated_at);\n";
/**
 * Creates the supastash_sync_marks table if it doesn't exist
 *
 * New table for sync marks
 */
export declare function createSyncStatusTable(): Promise<void>;
//# sourceMappingURL=createSyncStatus.d.ts.map