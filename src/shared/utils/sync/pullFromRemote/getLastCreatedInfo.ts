const DEFAULT_LAST_CREATED_AT = "2000-01-01T00:00:00Z";

/**
 * Gets the last synced timestamp for a given table
 * @deprecated Use getSupastashSyncStatus instead
 */
export async function getLastCreatedInfo(table: string): Promise<string> {
  return DEFAULT_LAST_CREATED_AT;
}

/**
 * Updates the last synced timestamp for a given table
 * @deprecated Use setSupastashSyncStatus instead
 */
export async function updateLastCreatedInfo(
  table: string,
  lastCreatedAt: string
) {
  return;
}
