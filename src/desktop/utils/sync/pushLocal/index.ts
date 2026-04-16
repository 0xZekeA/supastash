import { getSupastashConfig } from "../../../../shared/core/config";
import { syncCalls } from "../../../../shared/store/syncCalls";
import log from "../../../../shared/utils/logs";
import { getAllTables } from "../../../../shared/utils/sync/getAllTables";
import { runLimitedConcurrency } from "../../../../shared/utils/sync/pullFromRemote/runLimitedConcurrency";
import { SyncInfoUpdater } from "../../../../shared/utils/sync/queryStatus";
import { pushLocalDataToRemote } from "./sendUnsyncedToSupabase";

let emptyPassCount = 0;
let lastEmptyPassAt = 0;

const tablePushLock = new Map<string, boolean>();

/**
 * Pushes the local data to the remote database
 */
export async function pushLocalData() {
  let tablesCompleted = 0;
  let numberOfTables = 0;
  try {
    const tables: string[] | null = await getAllTables();
    if (!tables) {
      log("[Supastash] No tables found");
      return;
    }

    const excludeTables = getSupastashConfig()?.excludeTables?.push || [];

    const tablesToPush = tables.filter(
      (table) => !excludeTables?.includes(table)
    );
    numberOfTables = tablesToPush.length;
    SyncInfoUpdater.setInProgress({
      action: "start",
      type: "push",
    });

    SyncInfoUpdater.setNumberOfTables({
      amount: numberOfTables,
      type: "push",
    });

    const results: { table: string; hadWork: boolean; error?: string }[] = [];

    const jobs = tablesToPush.map((table) => async () => {
      SyncInfoUpdater.setCurrentTable({
        table,
        type: "push",
      });
      if (tablePushLock.get(table)) {
        results.push({ table, hadWork: false });
        return;
      }
      tablePushLock.set(table, true);
      try {
        const onPush = syncCalls.get(table)?.push;
        SyncInfoUpdater.markLogStart({
          type: "push",
          table,
        });

        const hadWork = await pushLocalDataToRemote(table, onPush);
        results.push({ table, hadWork: !!hadWork });
        SyncInfoUpdater.markLogSuccess({
          type: "push",
          table,
        });
      } catch (e: any) {
        const msg = e?.message ?? e?.code ?? e?.name ?? String(e);
        SyncInfoUpdater.markLogError({
          type: "push",
          table,
          lastError: e,
          errorCount: 1,
        });
        results.push({ table, hadWork: false, error: msg });
        log(`[Supastash] Push table failed: ${table} — ${msg}`);
      } finally {
        tablesCompleted++;

        SyncInfoUpdater.setTablesCompleted({
          amount: tablesCompleted,
          type: "push",
        });
        tablePushLock.set(table, false);
      }
    });

    await runLimitedConcurrency(jobs, 3);

    const hadAnyWork = results.some((r) => r.hadWork);
    if (!hadAnyWork) {
      emptyPassCount += 1;
      if (emptyPassCount % 150 === 0) {
        const now = Date.now();
        const gap = lastEmptyPassAt ? now - lastEmptyPassAt : 0;
        lastEmptyPassAt = now;
        const noSyncTables = results.map((r) => r.table).join(", ");
        log(
          `[Supastash] No pushable data for: ${noSyncTables} (empty passes: ${emptyPassCount})${
            gap ? ` in the last ${gap}ms` : ""
          }`
        );
      }
    } else {
      emptyPassCount = 0;
      lastEmptyPassAt = Date.now();
    }
  } catch (error) {
    log(`[Supastash] Error pushing local data to remote database: ${error}`);
  } finally {
    SyncInfoUpdater.reset({ type: "push" });
  }
}
