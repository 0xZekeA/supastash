/**
 * Gets the last synced timestamp for a given table
 * @deprecated Use getSupastashSyncStatus instead
 */
export declare function getLastPulledInfo(table: string): Promise<string>;
/**
 * Updates the last synced timestamp for a given table
 * @deprecated Use setSupastashSyncStatus instead
 */
export declare function updateLastPulledInfo(table: string, lastSyncedAt: string): Promise<void>;
//# sourceMappingURL=getLastPulledInfo.d.ts.map