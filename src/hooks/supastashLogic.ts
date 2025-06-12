import { useEffect, useRef, useState } from "react";
import { getSupastashConfig } from "../core/config";
import { supastashDbErrorMsg } from "../db/dbErrorMsg";
import { useSyncEngine } from "../hooks/syncEngine";
import { SupastashHookReturn } from "../types/supastashConfig.types";
import {
  createDeletedStatusTable,
  createSyncStatusTable,
} from "../utils/schema/createSyncStatus";
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
export function useSupastash(): SupastashHookReturn {
  const [dbReady, setDbReady] = useState(false);
  const initialized = useRef(false);
  const config = getSupastashConfig();

  if (!config.sqliteClient || !config.sqliteClientType) {
    console.error(`
      [Supastash] ${supastashDbErrorMsg}`);
    return {
      dbReady: false,
      startSync: () => {},
      stopSync: () => {},
    };
  }

  if (!config.supabaseClient) {
    console.error(
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
      // Create tables
      await createSyncStatusTable();
      await createDeletedStatusTable();
      // On schema init
      if (config.onSchemaInit) {
        await config.onSchemaInit();
      }
      setDbReady(true);
    }

    init();
  }, []);

  const { startSync, stopSync } = useSyncEngine();
  useEffect(() => {
    if (dbReady) {
      startSync();
    }
  }, [dbReady]);

  return { dbReady, stopSync, startSync };
}
