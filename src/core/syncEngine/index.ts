import { log } from "console";
import { getSupastashConfig } from "../config";
import { pullFromRemote } from "./pullFromRemote";
import { pushLocalData } from "./pushLocal";

let isSyncing = false;
let lastFullSync = 0;

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
