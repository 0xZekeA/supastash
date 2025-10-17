import { getSupastashDb } from "../../db/dbInitializer";
import { DEFAULT_SYNC_LOG_ENTRY, syncInfo, syncStatusMap, } from "../../store/syncStatus";
import { supastashEventBus } from "../events/eventBus";
/**
 * Sets the sync status of a query (row) in a specific table.
 * Automatically removes the entry if the status is 'success'.
 *
 * @param rowId - The unique ID of the row
 * @param table - The name of the table
 * @param status - One of: "pending", "success", or "error"
 */
export function setQueryStatus(rowId, table, status) {
    if (status === "success") {
        syncStatusMap.get(table)?.delete(rowId);
        return;
    }
    if (syncStatusMap.has(table)) {
        syncStatusMap.get(table)?.set(rowId, status);
    }
    else {
        syncStatusMap.set(table, new Map());
        syncStatusMap.get(table)?.set(rowId, status);
    }
}
/**
 * Gets the sync status of a table from the database.
 *
 * @param table - Table name
 */
export async function getQueryStatusFromDb(table) {
    const db = await getSupastashDb();
    const tableData = await db.getAllAsync(`SELECT id FROM ${table} WHERE synced_at IS NULL`);
    let tableMap = syncStatusMap.get(table);
    if (!tableMap) {
        tableMap = new Map();
        syncStatusMap.set(table, tableMap);
    }
    for (const row of tableData) {
        tableMap.set(row.id, "pending");
    }
}
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
export function getTableStatus(table) {
    const tableStatus = syncStatusMap.get(table);
    const size = tableStatus?.size;
    const statusArray = Array.from(tableStatus?.values() || []);
    let errorCount = 0;
    let pendingCount = 0;
    statusArray.forEach((status) => {
        if (status === "error") {
            errorCount++;
        }
        else if (status === "pending") {
            pendingCount++;
        }
    });
    let status = "success";
    if (pendingCount > 0) {
        status = "pending";
    }
    else if (errorCount > 0) {
        status = "error";
    }
    return { size, errors: errorCount, pending: pendingCount, status };
}
/**
 * Gets the global sync status across all tracked tables.
 *
 * @returns "error" if any table has errors,
 *          "pending" if any table is syncing,
 *          "synced" if all tables are fully synced
 */
export function getSupastashStatus() {
    const tables = Array.from(syncStatusMap.keys());
    for (const table of tables) {
        const tableStatus = getTableStatus(table);
        if (tableStatus.status === "error") {
            return "error";
        }
        if (tableStatus.status === "pending") {
            return "pending";
        }
    }
    return "synced";
}
let storeSyncInfo = structuredClone(syncInfo);
function snapshot() {
    return structuredClone(storeSyncInfo);
}
function emit() {
    supastashEventBus.emit("updateSyncInfo", snapshot());
}
export const SyncInfoUpdater = {
    setInProgress: ({ action, type, }) => {
        const next = structuredClone(storeSyncInfo);
        next[type].inProgress = action === "start";
        storeSyncInfo = next;
        emit();
    },
    setTablesCompleted: ({ amount, type, }) => {
        const next = structuredClone(storeSyncInfo);
        next[type].tablesCompleted = amount;
        storeSyncInfo = next;
        emit();
    },
    setNumberOfTables: ({ amount, type, }) => {
        const next = structuredClone(storeSyncInfo);
        next[type].numberOfTables = amount;
        storeSyncInfo = next;
        emit();
    },
    setCurrentTable: ({ table, type, }) => {
        const next = structuredClone(storeSyncInfo);
        next[type].currentTable = {
            name: table,
            unsyncedDataCount: 0,
            unsyncedDeletedCount: 0,
        };
        storeSyncInfo = next;
        emit();
    },
    setLastSyncLog: ({ key, value, type, table, }) => {
        const next = structuredClone(storeSyncInfo);
        const arr = next[type].lastSyncLog;
        const row = arr.find((l) => l.table === table);
        if (!row) {
            arr.push({
                ...DEFAULT_SYNC_LOG_ENTRY,
                table,
                [key]: value,
            });
        }
        else {
            row[key] = value;
        }
        storeSyncInfo = next;
        emit();
    },
    setUnsyncedDataCount: ({ amount, type, table, }) => {
        const next = structuredClone(storeSyncInfo);
        next[type].currentTable.unsyncedDataCount = amount;
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "unsyncedDataCount",
            value: amount,
        });
        storeSyncInfo = next;
        emit();
    },
    setUnsyncedDeletedCount: ({ amount, type, table, }) => {
        const next = structuredClone(storeSyncInfo);
        next[type].currentTable.unsyncedDeletedCount = amount;
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "unsyncedDeletedCount",
            value: amount,
        });
        storeSyncInfo = next;
        emit();
    },
    // convenience helpers (optional)
    markLogStart: ({ type, table }) => SyncInfoUpdater.setLastSyncLog({
        type,
        table,
        key: "startTime",
        value: Date.now(),
    }),
    markLogSuccess: ({ type, table, }) => {
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "success",
            value: true,
        });
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "endTime",
            value: Date.now(),
        });
    },
    markLogError: ({ type, table, lastError, errorCount, rowsFailed = 0, }) => {
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "success",
            value: false,
        });
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "lastError",
            value: lastError,
        });
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "errorCount",
            value: errorCount,
        });
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "endTime",
            value: Date.now(),
        });
        SyncInfoUpdater.setLastSyncLog({
            type,
            table,
            key: "rowsFailed",
            value: rowsFailed ?? 0,
        });
    },
    reset: ({ type }) => {
        const next = structuredClone(storeSyncInfo);
        next[type] = {
            ...next[type],
            inProgress: false,
            numberOfTables: 0,
            tablesCompleted: 0,
            currentTable: { name: "", unsyncedDataCount: 0, unsyncedDeletedCount: 0 },
            lastSyncedAt: Date.now(),
        };
        storeSyncInfo = next;
        emit();
    },
    getSnapshot: snapshot,
};
