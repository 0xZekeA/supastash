/**
 * A map tracking sync status for each row in each table.
 *
 * @example
 * {
 *   "table1": {
 *     "1": "pending",
 *     "2": "success",
 *     "3": "error"
 *   },
 *   "table2": {
 *     "a": "success",
 *     "b": "pending"
 *   }
 * }
 *
 * This structure means:
 * - `syncStatusMap.get("table1")?.get("1")` would return "pending"
 * - Outer key = table name
 * - Inner key = row ID (as string)
 * - Value = sync status of that row
 */
export const syncStatusMap = new Map();
export const syncInfo = {
    pull: {
        inProgress: false,
        numberOfTables: 0,
        tablesCompleted: 0,
        currentTable: {
            name: "",
            unsyncedDataCount: 0,
            unsyncedDeletedCount: 0,
        },
        lastSyncedAt: 0,
        lastSyncLog: [],
    },
    push: {
        inProgress: false,
        numberOfTables: 0,
        tablesCompleted: 0,
        currentTable: {
            name: "",
            unsyncedDataCount: 0,
            unsyncedDeletedCount: 0,
        },
        lastSyncedAt: 0,
        lastSyncLog: [],
    },
};
export const DEFAULT_SYNC_LOG_ENTRY = {
    table: "",
    filterKey: "",
    filterJson: [],
    action: "push",
    success: true,
    errorCount: 0,
    unsyncedDataCount: 0,
    unsyncedDeletedCount: 0,
    rowsFailed: 0,
    lastError: null,
    startTime: 0,
    endTime: 0,
};
