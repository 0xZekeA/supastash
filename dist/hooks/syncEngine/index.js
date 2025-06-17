import { useRef } from "react";
import { AppState } from "react-native";
import { getSupastashConfig } from "../../core/config";
import { syncCalls } from "../../store/syncCalls";
import { tableFilters } from "../../store/tableFilters";
import { isOnline } from "../../utils/connection";
import log from "../../utils/logs";
import { updateLocalDb } from "../../utils/sync/pullFromRemote/updateLocalDb";
import { pushLocalDataToRemote } from "../../utils/sync/pushLocal/sendUnsyncedToSupabase";
import { pullFromRemote } from "./pullFromRemote";
import { pushLocalData } from "./pushLocal";
let isSyncing = false;
let lastFullSync = 0;
const syncPollingInterval = getSupastashConfig().pollingInterval?.push || 30000;
/**
 * Syncs the local data to the remote database
 */
export async function syncAll(force = false) {
  if (isSyncing) return;
  if (!(await isOnline())) return;
  try {
    isSyncing = true;
    if (!getSupastashConfig().syncEngine?.pull) {
      const now = Date.now();
      const shouldPull =
        force ||
        now - lastFullSync >
          (getSupastashConfig().pollingInterval?.pull || 30000);
      if (shouldPull) {
        await pullFromRemote();
        lastFullSync = now;
      }
    }
    await pushLocalData();
  } catch (error) {
    log(`[Supastash] Error syncing: ${error}`);
  } finally {
    isSyncing = false;
  }
}
export function useSyncEngine() {
  const isSyncingRef = useRef(false);
  const intervalRef = useRef(null);
  const appStateRef = useRef(null);
  function startSync() {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const config = getSupastashConfig();
    const syncPollingInterval = config.pollingInterval?.push ?? 30000;
    intervalRef.current = setInterval(() => {
      syncAll();
    }, syncPollingInterval);
    appStateRef.current = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncAll(true);
      }
    });
  }
  function stopSync() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    appStateRef.current?.remove?.();
    isSyncingRef.current = false;
  }
  return { startSync, stopSync };
}
/**
 * Manually syncs a **single** table with Supabase.
 *
 * This function:
 * - Pulls remote data into local SQLite (if a pull handler is registered)
 * - Pushes unsynced local data to Supabase
 * - Skips syncing if already in progress for this table
 * - Applies filter if `useFiltersFromStore` is enabled
 *
 * Use this for explicit sync triggers (e.g., pull-to-refresh).
 *
 * @param {string} table - The name of the table to sync.
 * @returns {Promise<void>}
 */
export async function syncTable(table) {
  const config = getSupastashConfig();
  const { useFiltersFromStore = true } = config?.syncEngine || {};
  const filter = useFiltersFromStore ? tableFilters.get(table) : undefined;
  if (!getSupastashConfig().syncEngine?.pull) {
    await updateLocalDb(table, filter, syncCalls.get(table)?.pull);
  }
  await pushLocalDataToRemote(table, syncCalls.get(table)?.push);
}
/**
 * Manually syncs **all registered tables** with Supabase.
 *
 * This function:
 * - Triggers a full sync of all registered tables
 * - Forces a sync outside the normal polling schedule
 * - Skips any table that is already syncing
 *
 * Useful for global refreshes (e.g., on app foreground).
 *
 * @returns {Promise<void>}
 */
export async function syncAllTables() {
  await syncAll(true);
}
