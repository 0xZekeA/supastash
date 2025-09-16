import { useEffect, useRef, useState } from "react";
import { getSupastashConfig } from "../core/config";
import { supastashDbErrorMsg } from "../db/dbErrorMsg";
import { useSyncEngine } from "../hooks/syncEngine";
import { localCache } from "../store/localCache";
import {
  filterTracker,
  tableFilters,
  tableFiltersUsed,
} from "../store/tableFilters";
import { SupastashHookReturn } from "../types/supastashConfig.types";
import { logError, logWarn } from "../utils/logs";
import { createSyncStatusTable } from "../utils/schema/createSyncStatus";
import { supabaseClientErr } from "../utils/supabaseClientErr";

/**
 * React hook to initialize and manage Supastash.
 *
 * Responsibilities:
 * - Initializes the Supastash client.
 * - Sets up the SQLite database.
 * - Creates internal sync status tables.
 * - Invokes the user-defined schema initializer (if provided).
 * - Starts the sync engine once the DB is ready.
 *
 * @returns {{
 *   dbReady: boolean,
 *   startSync: () => void,
 *   stopSync: () => void
 * }} Object containing the DB readiness state and sync control functions.
 */
export function useSupastash(lazy: boolean = false): SupastashHookReturn {
  const [dbReady, setDbReady] = useState(false);
  const initialized = useRef(false);
  const config = getSupastashConfig();

  const { startSync, stopSync } = useSyncEngine();

  if (!config.sqliteClient || !config.sqliteClientType) {
    logError(`
      [Supastash] ${supastashDbErrorMsg}`);

    return {
      dbReady: false,
      startSync: () => {},
      stopSync: () => {},
    };
  }

  if (!config.supabaseClient) {
    logError(
      `[Supastash] Add a supabase client to config ${supabaseClientErr}`
    );
    return {
      dbReady: false,
      startSync: () => {},
      stopSync: () => {},
    };
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        // Create supastash metadata tables
        await createSyncStatusTable();
        // On schema init
        if (config.onSchemaInit) {
          await config.onSchemaInit();
        }
      } catch (error) {
        logError(`[Supastash] Error initializing: ${error}`);
      } finally {
        setDbReady(true);
      }
    }

    init();
    return () => {
      initialized.current = false;
      filterTracker.clear();
      tableFilters.clear();
      tableFiltersUsed.clear();
      localCache.clear();
    };
  }, []);

  useEffect(() => {
    if (lazy) return;
    if (dbReady) {
      try {
        startSync();
      } catch (error) {
        logWarn(`[Supastash] Error starting sync: ${error}`);
      }
    }

    return () => {
      stopSync();
    };
  }, [dbReady]);

  return { dbReady, stopSync, startSync };
}
