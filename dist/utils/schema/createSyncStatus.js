import { getSupastashDb } from "../../db/dbInitializer";
/**
 * Creates the supastash_deleted_status table if it doesn't exist
 *
 * Deprecated table for deleted status
 * @deprecated Use createSyncStatusTable instead
 */
export async function createDeletedStatusTable() {
    return;
}
export const SYNC_STATUS_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS supastash_sync_marks (
  table_name       TEXT NOT NULL,
  filter_key       TEXT NOT NULL,         
  filter_json      TEXT NULL,             
  last_created_at  TEXT NULL,             
  last_synced_at   TEXT NULL,   
  last_synced_at_pk     TEXT NULL,          
  last_deleted_at  TEXT NULL,             
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (table_name, filter_key)
);`;
export const ADD_PK_TO_SYNC_MARKS_SQL = `
  ALTER TABLE supastash_sync_marks ADD COLUMN last_synced_at_pk TEXT NULL;
`;
export const INDEX_SYNC_MARKS_SQL = `
  CREATE INDEX IF NOT EXISTS idx_supastash_marks_updated
    ON supastash_sync_marks(updated_at);
`;
let addedPk = false;
/**
 * Creates the supastash_sync_marks table if it doesn't exist
 *
 * New table for sync marks
 */
export async function createSyncStatusTable() {
    const db = await getSupastashDb();
    await db.execAsync(SYNC_STATUS_TABLES_SQL);
    try {
        if (addedPk)
            return;
        addedPk = true;
        await db.execAsync(ADD_PK_TO_SYNC_MARKS_SQL);
    }
    catch (error) {
        // Ignore error if column already exists
    }
    await db.execAsync(INDEX_SYNC_MARKS_SQL);
}
