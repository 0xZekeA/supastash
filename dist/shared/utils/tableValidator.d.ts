/**
 * Checks if the table exists in the local database
 * @param tableName - The name of the table to check
 * @returns true if the table exists, false otherwise
 */
export declare function checkIfTableExist(tableName: string): Promise<boolean>;
/**
 * Throws an error if the table does not exist
 * @param tableName - The name of the table to check
 */
export declare function assertTableExists(tableName: string): Promise<void>;
//# sourceMappingURL=tableValidator.d.ts.map