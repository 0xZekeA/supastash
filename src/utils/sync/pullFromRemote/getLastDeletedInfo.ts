const DEFAULT_LAST_DELETED_AT = "2000-01-01T00:00:00Z";

/**
 * Gets the last deleted timestamp for a given table
 * @deprecated Use getSupastashSyncStatus instead
 */
export async function getLastDeletedInfo(table: string): Promise<string> {
  return DEFAULT_LAST_DELETED_AT;
}

/**
 * Updates the last deleted timestamp for a given table
 * @deprecated Use setSupastashSyncStatus instead
 */
export async function updateLastDeletedInfo(
  table: string,
  lastDeletedAt: string
) {
  return;
}
