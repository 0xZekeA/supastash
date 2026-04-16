import { getSupastashConfig } from "../../../../shared/core/config";
import { syncCalls } from "../../../../shared/store/syncCalls";
import { tableFilters } from "../../../../shared/store/tableFilters";
import log from "../../../../shared/utils/logs";
import { getAllTables } from "../../../../shared/utils/sync/getAllTables";
import { runLimitedConcurrency } from "../../../../shared/utils/sync/pullFromRemote/runLimitedConcurrency";
import { SyncInfoUpdater } from "../../../../shared/utils/sync/queryStatus";
import { updateLocalDb } from "../../../utils/sync/pullFromRemote/updateLocalDb";

/**
 * Pulls the data from the remote database to the local database
 */
export async function pullFromRemote() {
  let numberOfTables = 0;
  let tablesCompleted = 0;
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

    numberOfTables = tablesToPull.length;

    SyncInfoUpdater.setInProgress({
      action: "start",
      type: "pull",
    });

    SyncInfoUpdater.setNumberOfTables({
      amount: numberOfTables,
      type: "pull",
    });

    const toPull = tablesToPull.map((table) => async () => {
      try {
        SyncInfoUpdater.markLogStart({
          type: "pull",
          table,
        });
        const filter = tableFilters.get(table);
        const onReceiveRecord = syncCalls.get(table)?.pull;
        await updateLocalDb(table, filter, onReceiveRecord);
        SyncInfoUpdater.markLogSuccess({
          type: "pull",
          table,
        });
      } catch (e: any) {
        SyncInfoUpdater.markLogError({
          type: "pull",
          table,
          lastError: e,
          errorCount: 1,
        });
        log(
          `[Supastash] pull table failed: ${table} — ${e?.code ?? e?.name ?? e}`
        );
      } finally {
        tablesCompleted++;

        SyncInfoUpdater.setTablesCompleted({
          amount: tablesCompleted,
          type: "pull",
        });
      }
    });
    await runLimitedConcurrency(toPull, 3);
  } catch (error) {
    log(`[Supastash] Error pulling from remote: ${error}`);
  } finally {
    SyncInfoUpdater.reset({
      type: "pull",
    });
  }
}
