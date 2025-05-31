import { supastashDbErrorMsg } from "@/db/dbErrorMsg";
import {
  createDeletedStatusTable,
  createSyncStatusTable,
} from "@/utils/schema/createSyncStatus";
import { useEffect, useRef } from "react";
import { getSupastashConfig } from "./config";
import { supabaseClientErr } from "./supabaseClientErr";
import useSyncEngine from "./syncEngine";

function useSupastashLogic() {
  const initialized = useRef(false);
  const config = getSupastashConfig();

  // run an instance of configureSupastash
  // If not found, throw an error
  if (!config.sqliteClient || !config.sqliteClientType) {
    console.error(`
      [Supastash] ${supastashDbErrorMsg}`);
    return;
  }

  if (!config.supabaseClient) {
    console.error(
      `[Supastash] Add a supabase client to config ${supabaseClientErr}`
    );
    return;
  }

  useSyncEngine();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Create tables
    createSyncStatusTable();
    createDeletedStatusTable();

    // On schema init
    if (config.onSchemaInit) {
      config.onSchemaInit();
    }
  }, [config.onSchemaInit]);
}

export default useSupastashLogic;
