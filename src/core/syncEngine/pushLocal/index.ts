import { getSupastashConfig } from "@/core/config";
import log from "@/utils/logs";
import { getAllTables } from "@/utils/sync/getAllTables";
import { pushLocalDataToRemote } from "@/utils/sync/pushLocal/sendUnsyncedToSupabase";

/**
 * Pushes the local data to the remote database
 */
export async function pushLocalData() {
  try {
    log("[Supastash] Pushing local data to remote database");

    const tables: string[] | null = await getAllTables();
    if (!tables) {
      log("No tables found");
      return;
    }

    const excludeTables = getSupastashConfig()?.excludeTables?.push;

    const tablesToPush = tables.filter(
      (table) => !excludeTables?.includes(table)
    );

    for (const table of tablesToPush) {
      await pushLocalDataToRemote(table);
    }
  } catch (error) {
    log(`[Supastash] Error pushing local data to remote database: ${error}`);
  }
}
