/**
 * Gets the last deleted timestamp for a given table
 * @param table - The table to get the last deleted timestamp for
 * @returns The last deleted timestamp
 */
export declare function getLastDeletedInfo(table: string): Promise<string>;
/**
 * Updates the last deleted timestamp for a given table
 * @param table - The table to update the last deleted timestamp for
 * @param lastDeletedAt - The last deleted timestamp
 */
export declare function updateLastDeletedInfo(table: string, lastDeletedAt: string): Promise<void>;
//# sourceMappingURL=getLastDeletedInfo.d.ts.map