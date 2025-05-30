import { getSupastashConfig } from "@/core/config";
import log from "@/utils/logs";
import { getAllTables } from "@/utils/sync/getAllTables";
import { updateLocalDb } from "@/utils/sync/pullFromRemote/updateLocalDb";

/**
 * Pulls the data from the remote database to the local database
 */
export async function pullFromRemote() {
  try {
    log("[Supastash] Pulling data from remote database");

    const tables = await getAllTables();

    if (!tables) {
      log(`[Supastash] No tables found`);
      return;
    }

    const excludeTables = getSupastashConfig()?.excludeTables?.pull;

    const tablesToPull = tables.filter(
      (table) => !excludeTables?.includes(table)
    );

    for (const table of tablesToPull) {
      await updateLocalDb(table);
    }
  } catch (error) {
    log(`[Supastash] Error pulling from remote: ${error}`);
  }
}
