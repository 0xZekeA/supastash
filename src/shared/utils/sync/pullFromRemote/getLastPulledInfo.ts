const DEFAULT_LAST_PULLED_AT = "2000-01-01T00:00:00Z";
const SYNC_STATUS_TABLE = "supastash_sync_status";

/**
 * Gets the last synced timestamp for a given table
 * @deprecated Use getSupastashSyncStatus instead
 */
export async function getLastPulledInfo(table: string): Promise<string> {
  return DEFAULT_LAST_PULLED_AT;
}

/**
 * Updates the last synced timestamp for a given table
 * @deprecated Use setSupastashSyncStatus instead
 */
export async function updateLastPulledInfo(
  table: string,
  lastSyncedAt: string
) {
  return;
}
