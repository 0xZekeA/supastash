import { useEffect, useState } from "react";
import { supastashEventBus } from "../../utils/events/eventBus";
import { getSupastashStatus } from "../../utils/sync/queryStatus";
/**
 * React hook that returns the current global sync status across all tracked Supastash tables.
 *
 * - Listens for the "updateSyncStatus" event from the event bus.
 * - Recomputes sync status whenever the event is emitted (e.g. after CRUD operations).
 * - Status can be:
 *   - "pending" → at least one table has pending sync rows
 *   - "error" → at least one table has failed sync rows
 *   - "synced" → all tracked tables are fully synced
 *
 * @returns {"pending" | "error" | "synced"} The current sync status
 *
 * @example
 * const syncStatus = useSupastashSyncStatus();
 * if (syncStatus === "pending") showSyncingIndicator();
 */
export function useSupastashSyncStatus() {
    const [syncStatus, setSyncStatus] = useState("synced");
    useEffect(() => {
        const refreshSyncStatus = () => {
            const status = getSupastashStatus();
            setSyncStatus(status);
        };
        refreshSyncStatus();
        supastashEventBus.on("updateSyncStatus", refreshSyncStatus);
        return () => {
            supastashEventBus.off("updateSyncStatus", refreshSyncStatus);
        };
    }, []);
    return syncStatus;
}
