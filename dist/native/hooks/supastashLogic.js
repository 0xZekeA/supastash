import { useEffect, useRef, useState } from "react";
import { getSupastashConfig } from "../../shared/core/config";
import { supastashDbErrorMsg } from "../../shared/db/dbErrorMsg";
import { localCache } from "../../shared/store/localCache";
import { filterTracker, tableFilters, tableFiltersUsed, } from "../../shared/store/tableFilters";
import { supastashEventBus } from "../../shared/utils/events/eventBus";
import { logError, logWarn } from "../../shared/utils/logs";
import { createSyncStatusTable } from "../../shared/utils/schema/createSyncStatus";
import { supabaseClientErr } from "../../shared/utils/supabaseClientErr";
import { useSyncEngine } from "./syncEngine";
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
export function useSupastash(lazy = false) {
    const [dbReady, setDbReady] = useState(false);
    const initialized = useRef(false);
    const config = getSupastashConfig();
    const { startSync, stopSync } = useSyncEngine();
    if (!config.sqliteClient || !config.sqliteClientType) {
        logError(`
      [Supastash] ${supastashDbErrorMsg}`);
        return {
            dbReady: false,
            startSync: () => { },
            stopSync: () => { },
        };
    }
    if (!config.supabaseClient) {
        logError(`[Supastash] Add a supabase client to config ${supabaseClientErr}`);
        return {
            dbReady: false,
            startSync: () => { },
            stopSync: () => { },
        };
    }
    useEffect(() => {
        if (initialized.current)
            return;
        initialized.current = true;
        async function init() {
            try {
                // Create supastash metadata tables
                await createSyncStatusTable();
                // On schema init
                if (config.onSchemaInit) {
                    await config.onSchemaInit();
                }
                // If init fails, db will not be ready
                setDbReady(true);
            }
            catch (error) {
                logError(`[Supastash] Error initializing: ${error}`);
                setDbReady(false);
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
        if (lazy)
            return;
        const start = () => {
            if (dbReady) {
                try {
                    startSync();
                }
                catch (error) {
                    logWarn(`[Supastash] Error starting sync: ${error}`);
                }
            }
        };
        start();
        supastashEventBus.on("stopSupastashSync", stopSync);
        supastashEventBus.on("startSupastashSync", start);
        return () => {
            stopSync();
            supastashEventBus.off("stopSupastashSync", stopSync);
            supastashEventBus.off("startSupastashSync", start);
        };
    }, [dbReady]);
    return { dbReady, stopSync, startSync };
}
