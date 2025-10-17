import { SyncInfo, SyncLogEntry } from "../types/syncEngine.types";
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
//# sourceMappingURL=syncStatus.d.ts.map