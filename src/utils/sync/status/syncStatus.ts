import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { SupastashFilter } from "../../../types/realtimeData.types";
import {
  PublicScope,
  SupastashSyncStatus,
} from "../../../types/syncEngine.types";
import { logError } from "../../logs";
import { createSyncStatusTable } from "../../schema/createSyncStatus";
import {
  clearSupastashSyncStatus,
  getSupastashSyncStatus,
  resetSupastashSyncStatus,
  setSupastashSyncStatus,
} from "./services";

const SYNC_STATUS_TABLE = "supastash_sync_marks";
const SERVER_SYNC_STATUS_TABLE = "supastash_server_sync_marks";
const getSyncStatusTable = () => {
  const cfg = getSupastashConfig();
  return cfg.replicationMode === "server-side"
    ? SERVER_SYNC_STATUS_TABLE
    : SYNC_STATUS_TABLE;
};
/**
 * Clears the sync log for a specific table.
 *
 * Removes all stored sync checkpoints (created / updated / deleted)
 * for the given table and filter key (if any).
 *
 * @param tableName - Name of the table whose sync status should be cleared.
 * @example
 * await clearLocalSyncLog("users");
 */
export async function clearLocalSyncLog(tableName: string) {
  await clearSupastashSyncStatus(tableName);
}

/**
 * Clears the sync log for every local table.
 *
 * Drops the `supastash_sync_marks` table and recreates it.
 * Use with caution — this wipes all sync history.
 *
 * @example
 * await clearAllLocalSyncLog();
 */
export async function clearAllLocalSyncLog() {
  const db = await getSupastashDb();
  const syncStatusTable = getSyncStatusTable();
  await db.runAsync(`DROP TABLE IF EXISTS ${syncStatusTable}`);
  await createSyncStatusTable();
}

/**
 *
 * Returns the stored timestamps and filter info, or `null` if
 * there is no entry for the table.
 * @param tableName - The name of the table to get the sync log for
 * @example
 * const syncLog = await getSyncLog("users");
 * console.log(syncLog);
 * return {
 *    table_name: "users",
 *    last_synced_at: "2021-01-01T00:00:00.000Z",
 *    last_deleted_at: "2021-01-01T00:00:00.000Z",
 *    filter_key: "1234567890",
 *    filter_json: "[...]",
 *    updated_at: "2021-01-01T00:00:00.000Z"
 * }
 */
export async function getSyncLog(
  tableName: string
): Promise<SupastashSyncStatus | null> {
  try {
    const syncStatus = await getSupastashSyncStatus(tableName);

    return syncStatus;
  } catch (error) {
    logError(error);
    return null;
  }
}

/**
 * Writes or updates the sync log for a table.
 *
 * Stores the latest `updated_at` and `updated_at_pk`
 * timestamps for a table + filter combination.
 *
 * @param table - Table name to update.
 * @param filters - Optional realtime filters to scope the log.
 * @param opts - Timestamp fields to set.
 * @example
 * await setSyncLog("users", undefined, {
 *   lastSyncedAt: new Date().toISOString(),
 *   lastSyncedAtPk: "00000000-0000-0000-0000-000000000000",
 * });
 */
export async function setSyncLog(
  table: string,
  filters: SupastashFilter[] | undefined,
  opts: {
    lastSyncedAt?: string | null;
    lastDeletedAt?: string | null;
    lastSyncedAtPk?: string | null;
    filterNamespace?: string;
  }
) {
  try {
    await setSupastashSyncStatus(table, filters, opts);
  } catch (e: any) {
    logError(`[Supastash] setMarks(${table}) failed`, e);
  }
}

/**
 * Resets one or more timestamps in the sync log for a table.
 *
 * @param table - Table to reset.
 * @param filters - Optional filters for a scoped reset.
 * @param scope - Field(s) to reset: "all" (default),
 *   "last_synced_at", or "last_deleted_at".
 * @example
 * await resetSyncLog("users", undefined, "all");
 */
export async function resetSyncLog(
  table: string,
  filters: SupastashFilter[] | undefined,
  scope: PublicScope = "all"
) {
  try {
    await resetSupastashSyncStatus(table, filters, scope);
  } catch (e: any) {
    logError(`[Supastash] resetMarks(${table}, ${scope}) failed`, e);
  }
}

/**
 * Deletes the sync log entry for a table (and optional filter key).
 *
 * @param table - Table name.
 * @param filters - Optional filters to target a specific row.
 * @example
 * await clearSyncLog("users");
 */
export async function clearSyncLog(table: string, filters?: SupastashFilter[]) {
  try {
    await clearSupastashSyncStatus(table, filters);
  } catch (e: any) {
    logError(`[Supastash] clearMarks(${table}) failed`, e);
  }
}

/** ------------------- DEPRECATED 🗑 Local Sync & Delete Log ------------------- */

/**
 * @deprecated Use `setSyncLog` instead.
 * Sets the sync timestamp for a given table.
 */
export async function setLocalSyncLog(
  tableName: string,
  lastSyncedAt: string,
  lastCreatedAt?: string
) {
  return;
}

/**
 * @deprecated Use `clearSyncLog` instead.
 * Clears the delete log for a given table.
 */
export async function clearLocalDeleteLog(tableName: string) {
  return;
}

/**
 * @deprecated Use `clearSyncLog` instead.
 * Clears the delete status for all local tables.
 */
export async function clearAllLocalDeleteLog() {
  return;
}

/**
 * @deprecated Use `getSyncLog` instead.
 * Gets the delete log for a given table.
 */
export async function getLocalDeleteLog(tableName: string) {
  return;
}

/**
 * @deprecated Use `setSyncLog` instead.
 * Sets the delete log for a given table.
 */
export async function setLocalDeleteLog(
  tableName: string,
  lastDeletedAt: string
) {
  return;
}
