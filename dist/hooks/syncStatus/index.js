import { useEffect, useState } from "react";
import { supastashEventBus } from "../../utils/events/eventBus";
import { getSupastashStatus, SyncInfoUpdater, } from "../../utils/sync/queryStatus";
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
export function useSupastashSyncStatus(debounceDelay = 40) {
    const [syncStatus, setSyncStatus] = useState("synced");
    const [syncInfo, setSyncInfo] = useState(() => SyncInfoUpdater.getSnapshot());
    useEffect(() => {
        const handleStatusUpdate = debounce(() => {
            setSyncStatus(getSupastashStatus());
        }, debounceDelay);
        handleStatusUpdate();
        supastashEventBus.on("updateSyncStatus", handleStatusUpdate);
        return () => {
            supastashEventBus.off("updateSyncStatus", handleStatusUpdate);
            handleStatusUpdate.cancel();
        };
    }, []);
    useEffect(() => {
        const handleInfoUpdate = debounce((next) => {
            setSyncInfo(next);
        }, debounceDelay);
        setSyncInfo(SyncInfoUpdater.getSnapshot());
        supastashEventBus.on("updateSyncInfo", handleInfoUpdate);
        return () => {
            supastashEventBus.off("updateSyncInfo", handleInfoUpdate);
            handleInfoUpdate.cancel();
        };
    }, []);
    return { syncStatus, syncInfo };
}
function debounce(fn, delay = 40) {
    let timeout;
    const debounced = (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
}
