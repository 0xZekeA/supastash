import { getSupastashConfig } from "../../../core/config";
import log from "../../../utils/logs";
import { getAllTables } from "../../../utils/sync/getAllTables";
import { pushLocalDataToRemote } from "../../../utils/sync/pushLocal/sendUnsyncedToSupabase";

let timesPushed = 0;
let lastPushed = 0;

/**
 * Pushes the local data to the remote database
 */
export async function pushLocalData() {
  try {
    const tables: string[] | null = await getAllTables();
    if (!tables) {
      log("No tables found");
      return;
    }

    const excludeTables = getSupastashConfig()?.excludeTables?.push || [];

    const tablesToPush = tables.filter(
      (table) => !excludeTables?.includes(table)
    );

    const noSync: string[] = [];

    for (const table of tablesToPush) {
      await pushLocalDataToRemote(table, undefined, noSync);
    }
    if (noSync.length > 0) {
      timesPushed++;
      if (timesPushed >= 30) {
        const timeSinceLastPush = Date.now() - lastPushed;
        lastPushed = Date.now();
        log(
          `[Supastash] No sync data found for tables: ${noSync.join(
            ", "
          )} (times pushed: ${timesPushed}) in the last ${timeSinceLastPush}ms`
        );
        timesPushed = 0;
      }
    }
  } catch (error) {
    log(`[Supastash] Error pushing local data to remote database: ${error}`);
  }
}
