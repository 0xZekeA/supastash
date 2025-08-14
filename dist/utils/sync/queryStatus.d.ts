/**
 * Sets the sync status of a query (row) in a specific table.
 * Automatically removes the entry if the status is 'success'.
 *
 * @param rowId - The unique ID of the row
 * @param table - The name of the table
 * @param status - One of: "pending", "success", or "error"
 */
export declare function setQueryStatus(rowId: string, table: string, status: "pending" | "success" | "error"): void;
/**
 * Gets the sync status of a table from the database.
 *
 * @param table - Table name
 */
export declare function getQueryStatusFromDb(table: string): Promise<void>;
/**
 * Gets the aggregate sync status of a specific table.
 *
 * @param table - Table name
 * @returns An object with:
 *  - size: total tracked rows
 *  - errors: number of rows in "error" status
 *  - pending: number of rows in "pending" status
 *  - status: overall table status: "success" | "pending" | "error"
 */
export declare function getTableStatus(table: string): {
    size: number | undefined;
    errors: number;
    pending: number;
    status: string;
};
/**
 * Gets the global sync status across all tracked tables.
 *
 * @returns "error" if any table has errors,
 *          "pending" if any table is syncing,
 *          "synced" if all tables are fully synced
 */
export declare function getSupastashStatus(): "error" | "pending" | "synced";
//# sourceMappingURL=queryStatus.d.ts.map