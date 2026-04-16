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
export const RECEIVED_DATA_THRESHOLD = 1000;
export const RECEIVED_DATA_COMPLETED_MAP = {};
export const DEFAULT_RECEIVED_DATA_COMPLETED = {
    completed: false,
    lastTimestamp: undefined,
    lastId: undefined,
};
/**
 * Global Sync Gate
 * ----------------
 * Acts as a hard stop for all sync operations across the app.
 */
let syncGateClosed = false;
/**
 * Closes the global sync gate.
 * Prevents all sync operations from running.
 */
export function closeSyncGate() {
    syncGateClosed = true;
}
/**
 * Opens the global sync gate.
 * Allows sync operations to run.
 */
export function openSyncGate() {
    syncGateClosed = false;
}
/**
 * Returns whether the global sync gate is currently closed.
 */
export function isSyncGateClosed() {
    return syncGateClosed;
}
