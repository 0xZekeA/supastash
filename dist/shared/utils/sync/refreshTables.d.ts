/**
 * Refreshes a single table
 * Use this when you want to update data to UI
 * @param table - The name of the table to refresh
 */
export declare function refreshTable(table: string): void;
/**
 * Refreshes all tables
 * Use this when you want to update data to UI
 */
export declare function refreshAllTables(): void;
/**
 * Refreshes a single table with a payload
 * Use this when you want to update data to UI
 * Must be the whole payload, not just the changes
 * @param table - The name of the table to refresh
 * @param payload - The payload to refresh the table with
 * @param operation - The operation to perform on the table
 * @deprecated Use refreshTable instead
 */
export declare function refreshTableWithPayload(table: string, payload: any, operation: "insert" | "update" | "delete" | "upsert"): void;
//# sourceMappingURL=refreshTables.d.ts.map