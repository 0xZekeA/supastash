import { useRef } from "react";
import { AppState } from "react-native";
import { getSupastashConfig } from "../../core/config";
import { isOnline } from "../../utils/connection";
import log from "../../utils/logs";
import { pullFromRemote } from "./pullFromRemote";
import { pushLocalData } from "./pushLocal";
let isSyncing = false;
let lastFullSync = 0;
const syncPollingInterval = getSupastashConfig().pollingInterval?.push || 30000;
/**
 * Syncs the local data to the remote database
 */
export async function syncEngine(force = false) {
    if (isSyncing)
        return;
    if (!(await isOnline()))
        return;
    try {
        isSyncing = true;
        await pushLocalData();
        if (!getSupastashConfig().syncEngine?.pull)
            return;
        const now = Date.now();
        const shouldPull = force ||
            now - lastFullSync >
                (getSupastashConfig().pollingInterval?.pull || 30000);
        if (shouldPull) {
            await pullFromRemote();
            lastFullSync = now;
        }
    }
    catch (error) {
        log(`[Supastash] Error syncing: ${error}`);
    }
    finally {
        isSyncing = false;
    }
}
export function useSyncEngine() {
    const isSyncingRef = useRef(false);
    const intervalRef = useRef(null);
    const appStateRef = useRef(null);
    function startSync() {
        if (isSyncingRef.current)
            return;
        isSyncingRef.current = true;
        const config = getSupastashConfig();
        const syncPollingInterval = config.pollingInterval?.push ?? 30000;
        intervalRef.current = setInterval(() => {
            syncEngine();
        }, syncPollingInterval);
        appStateRef.current = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                syncEngine(true);
            }
        });
    }
    function stopSync() {
        if (intervalRef.current)
            clearInterval(intervalRef.current);
        appStateRef.current?.remove?.();
        isSyncingRef.current = false;
    }
    return { startSync, stopSync };
}
