/**
 * Gets the last synced timestamp for a given table
 * @param table - The table to get the last synced timestamp for
 * @returns The last synced timestamp
 */
export declare function getLastPulledInfo(table: string): Promise<string>;
/**
 * Updates the last synced timestamp for a given table
 * @param table - The table to update the last synced timestamp for
 * @param lastSyncedAt - The last synced timestamp
 */
export declare function updateLastPulledInfo(table: string, lastSyncedAt: string): Promise<void>;
//# sourceMappingURL=getLastPulledInfo.d.ts.map