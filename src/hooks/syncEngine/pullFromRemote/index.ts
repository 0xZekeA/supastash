import { syncCalls } from "src/store/syncCalls";
import { getSupastashConfig } from "../../../core/config";
import { tableFilters } from "../../../store/tableFilters";
import log from "../../../utils/logs";
import { getAllTables } from "../../../utils/sync/getAllTables";
import { updateLocalDb } from "../../../utils/sync/pullFromRemote/updateLocalDb";

/**
 * Pulls the data from the remote database to the local database
 */
export async function pullFromRemote() {
  const config = getSupastashConfig();
  const { useFiltersFromStore = true } = config?.syncEngine || {};
  const filter = (table: string) =>
    useFiltersFromStore ? tableFilters.get(table) : undefined;
  try {
    const tables = await getAllTables();

    if (!tables) {
      log(`[Supastash] No tables found`);
      return;
    }

    const excludeTables = getSupastashConfig()?.excludeTables?.pull || [];

    const tablesToPull = tables.filter(
      (table) => !excludeTables?.includes(table)
    );

    for (const table of tablesToPull) {
      await updateLocalDb(table, filter(table), syncCalls.get(table)?.pull);
    }
  } catch (error) {
    log(`[Supastash] Error pulling from remote: ${error}`);
  }
}
