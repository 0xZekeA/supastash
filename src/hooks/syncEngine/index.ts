import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { getSupastashConfig } from "../../core/config";
import { syncCalls } from "../../store/syncCalls";
import { tableFilters } from "../../store/tableFilters";
import { isOnline } from "../../utils/connection";
import log from "../../utils/logs";
import { updateLocalDb } from "../../utils/sync/pullFromRemote/updateLocalDb";
import { pushLocalDataToRemote } from "../../utils/sync/pushLocal/sendUnsyncedToSupabase";
import { pullFromRemote as doPullFromRemote } from "./pullFromRemote";
import { pushLocalData as doPushLocalData } from "./pushLocal";

// -----------------------------
// Module-scoped state & tunables
// -----------------------------
let isSyncing = false;
let isPushing = false;
let isPulling = false;

let lastPullAt = 0;
let lastPushAt = 0;

const MIN_FOREGROUND_GAP = 5_000; // ms

// -----------------------------
// Core orchestration
// -----------------------------

/**
 * Push then (optionally) pull.
 * - Single flight across entire app via module-scoped flags.
 * - Both directions gated on connectivity.
 * - "force" ignores pull cadence timing.
 */
export async function syncAll(force: boolean = false): Promise<void> {
  if (isSyncing) return;
  if (!(await isOnline())) return;

  isSyncing = true;
  const started = Date.now();
  try {
    const cfg = getSupastashConfig();
    // PUSH
    if (cfg.syncEngine?.push) {
      await pushLocalDataSafe();
    }

    // PULL
    if (cfg.syncEngine?.pull) {
      const pullInterval = cfg.pollingInterval?.pull ?? 30_000;
      const now = Date.now();
      const due = force || now - lastPullAt >= pullInterval;
      if (due) {
        await pullFromRemoteSafe();
        lastPullAt = now;
      }
    }
  } catch (e: any) {
    log("[Supastash] Error in syncAll", {
      msg: String(e),
      code: e?.code ?? e?.name ?? "UNKNOWN",
    });
  } finally {
    isSyncing = false;
    log(`[Supastash] syncAll finished in ${Date.now() - started}ms`);
  }
}

// -----------------------------
// Directional helpers
// -----------------------------

async function pushLocalDataSafe(): Promise<void> {
  if (isPushing) return;
  if (!(await isOnline())) return;
  const cfg = getSupastashConfig();
  if (!cfg.syncEngine?.push) return;

  isPushing = true;
  try {
    await doPushLocalData();
    lastPushAt = Date.now();
  } catch (e: any) {
    log("[Supastash] push error", {
      msg: String(e),
      code: e?.code ?? e?.name ?? "UNKNOWN",
    });
  } finally {
    isPushing = false;
  }
}

async function pullFromRemoteSafe(): Promise<void> {
  if (isPulling) return;
  if (!(await isOnline())) return;

  const cfg = getSupastashConfig();
  if (!cfg.syncEngine?.pull) return;

  isPulling = true;
  try {
    await doPullFromRemote();
    lastPullAt = Date.now();
  } catch (e: any) {
    log("[Supastash] pull error", {
      msg: String(e),
      code: e?.code ?? e?.name ?? "UNKNOWN",
    });
  } finally {
    isPulling = false;
  }
}

// -----------------------------
// React hook: timer & lifecycle management
// -----------------------------

/**
 * Hook to start/stop the periodic sync engine.
 * - Staggers push & pull timers.
 * - Debounced foreground trigger.
 * - Shares module-level single-flight guards with syncAll().
 */
export function useSyncEngine() {
  // Timers & lifecycle
  const intervalRefPush = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalRefPull = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateSubRef = useRef<{ remove?: () => void } | null>(null);

  // Debounce foreground re-entry
  const lastForeground = useRef(0);

  function startSync() {
    if (
      intervalRefPush.current ||
      intervalRefPull.current ||
      appStateSubRef.current
    ) {
      return;
    }

    // Kick a one-shot global sync on start
    void syncAll(true);

    const cfg = getSupastashConfig();
    const pushEvery = cfg.pollingInterval?.push ?? 30_000;
    const pullEvery = cfg.pollingInterval?.pull ?? 30_000;

    // Push ticker
    intervalRefPush.current = setInterval(() => {
      void pushLocalDataSafe();
    }, pushEvery);

    // Pull ticker
    intervalRefPull.current = setInterval(() => {
      void pullFromRemoteSafe();
    }, pullEvery + 500);

    // Foreground trigger
    appStateSubRef.current = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const now = Date.now();
      if (now - lastForeground.current < MIN_FOREGROUND_GAP) return;
      lastForeground.current = now;
      void syncAll(true);
    });
  }

  function stopSync() {
    if (intervalRefPush.current) {
      clearInterval(intervalRefPush.current);
      intervalRefPush.current = null;
    }
    if (intervalRefPull.current) {
      clearInterval(intervalRefPull.current);
      intervalRefPull.current = null;
    }
    appStateSubRef.current?.remove?.();
    appStateSubRef.current = null;
  }

  // Auto-cleanup if the hook lives in a component lifecycle
  useEffect(() => stopSync, []);

  return { startSync, stopSync };
}

// -----------------------------
// Manual triggers
// -----------------------------

/**
 * Manually sync a single table (pull then push for that table).
 * - Uses table-specific handlers from syncCalls if provided.
 * - Respects configured filters when enabled.
 */
export async function syncTable(table: string): Promise<void> {
  if (!(await isOnline())) return;

  const cfg = getSupastashConfig();
  const { useFiltersFromStore = true } = cfg?.syncEngine || {};
  const filter = useFiltersFromStore ? tableFilters.get(table) : undefined;

  // Pull
  if (cfg.syncEngine?.pull) {
    try {
      await updateLocalDb(table, filter, syncCalls.get(table)?.pull);
    } catch (e: any) {
      log("[Supastash] syncTable pull error", {
        table,
        msg: String(e),
        code: e?.code ?? e?.name ?? "UNKNOWN",
      });
    }
  }

  // Push (use table handler if present)
  if (cfg.syncEngine?.push) {
    try {
      await pushLocalDataToRemote(table, syncCalls.get(table)?.push);
    } catch (e: any) {
      log("[Supastash] syncTable push error", {
        table,
        msg: String(e),
        code: e?.code ?? e?.name ?? "UNKNOWN",
      });
    }
  }
}

/**
 * Force a global sync pass now (push then pull if due).
 */
export async function syncAllTables(): Promise<void> {
  await syncAll(true);
}
