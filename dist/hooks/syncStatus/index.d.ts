import { SyncInfo } from "../../types/syncEngine.types";
/**
 * React hook that provides a **live snapshot of Supastash sync state** across all tracked tables.
 *
 * It listens for two global events:
 * - `"updateSyncStatus"` → high-level sync state (`pending`, `error`, or `synced`)
 * - `"updateSyncInfo"` → detailed sync progress (tables, logs, counts, etc.)
 *
 * Debouncing is used internally to prevent rapid UI re-renders during
 * frequent background sync updates.
 *
 * ---
 * **Returned Values**
 * - `syncStatus` → `"pending" | "error" | "synced"`
 * - `syncInfo` → `SyncInfo` object containing `pull` and `push` progress
 *
 * ---
 * **Example**
 * ```ts
 * const { syncStatus, syncInfo } = useSupastashSyncStatus(50); // 50ms debounce delay
 *
 * if (syncInfo.pull.inProgress) showPullingIndicator();
 * if (syncInfo.push.inProgress) showPushingIndicator();
 *
 * if (syncStatus === "pending") showSyncingBadge();
 * ```
 *
 * ---
 * **SyncInfo Structure**
 * - pull / push: `SyncInfoItem`
 *   - inProgress: boolean
 *   - numberOfTables: number
 *   - tablesCompleted: number
 *   - currentTable: { name, unsyncedDataCount, unsyncedDeletedCount }
 *   - lastSyncedAt: number
 *   - lastSyncLog: SyncLogEntry[]
 */
export declare function useSupastashSyncStatus(debounceDelay?: number): {
    syncStatus: "error" | "pending" | "synced";
    syncInfo: SyncInfo;
};
//# sourceMappingURL=index.d.ts.map