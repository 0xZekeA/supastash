import { ReceivedDataCompleted, ReceivedDataCompletedMap, SyncInfo, SyncLogEntry } from "../types/syncEngine.types";
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
export declare const syncStatusMap: Map<string, Map<string, "error" | "pending" | "success">>;
export declare const syncInfo: SyncInfo;
export declare const DEFAULT_SYNC_LOG_ENTRY: SyncLogEntry;
export declare const RECEIVED_DATA_THRESHOLD = 1000;
export declare const RECEIVED_DATA_COMPLETED_MAP: ReceivedDataCompletedMap;
export declare const DEFAULT_RECEIVED_DATA_COMPLETED: ReceivedDataCompleted;
/**
 * Closes the global sync gate.
 * Prevents all sync operations from running.
 */
export declare function closeSyncGate(): void;
/**
 * Opens the global sync gate.
 * Allows sync operations to run.
 */
export declare function openSyncGate(): void;
/**
 * Returns whether the global sync gate is currently closed.
 */
export declare function isSyncGateClosed(): boolean;
//# sourceMappingURL=syncStatus.d.ts.map