import log from "@/utils/logs";
import { useEffect } from "react";
import { AppState } from "react-native";
import { getSupastashConfig } from "../config";
import { pullFromRemote } from "./pullFromRemote";
import { pushLocalData } from "./pushLocal";

let isSyncing = false;
let lastFullSync = 0;
const syncPollingInterval = getSupastashConfig().pollingInterval.push;

/**
 * Syncs the local data to the remote database
 */
export async function syncEngine(force: boolean = false) {
  if (isSyncing) return;

  try {
    isSyncing = true;
    await pushLocalData();
    const now = Date.now();

    const shouldPull =
      force || now - lastFullSync > getSupastashConfig().pollingInterval.pull;
    if (shouldPull) {
      await pullFromRemote();
      lastFullSync = now;
    }
  } catch (error) {
    log(`[Supastash] Error syncing: ${error}`);
  } finally {
    isSyncing = false;
  }
}

export default function useSyncEngine() {
  useEffect(() => {
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncEngine(true);
      }
    });

    // Sync
    const interval = setInterval(() => {
      syncEngine();
    }, syncPollingInterval || 30000);

    return () => {
      appState.remove();
      clearInterval(interval);
    };
  }, []);
}
