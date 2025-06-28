/**
 * Gets the last synced timestamp for a given table
 * @param table - The table to get the last created timestamp for
 * @returns The last synced timestamp
 */
export declare function getLastCreatedInfo(table: string): Promise<string>;
/**
 * Updates the last synced timestamp for a given table
 * @param table - The table to update the last created timestamp for
 * @param lastCreatedAt - The last created timestamp
 */
export declare function updateLastCreatedInfo(table: string, lastCreatedAt: string): Promise<void>;
//# sourceMappingURL=getLastCreatedInfo.d.ts.map