import { getSupastashConfig } from "../../../core/config";
import { syncCalls } from "../../../store/syncCalls";
import { isOnline } from "../../../utils/connection";
import log from "../../../utils/logs";
import { getAllTables } from "../../../utils/sync/getAllTables";
import { runLimitedConcurrency } from "../../../utils/sync/pullFromRemote/runLimitedConcurrency";
import { pushLocalDataToRemote } from "../../../utils/sync/pushLocal/sendUnsyncedToSupabase";
let emptyPassCount = 0;
let lastEmptyPassAt = 0;
const tablePushLock = new Map();
/**
 * Pushes the local data to the remote database
 */
export async function pushLocalData() {
    try {
        const tables = await getAllTables();
        if (!tables) {
            log("[Supastash] No tables found");
            return;
        }
        if (!(await isOnline()))
            return;
        const excludeTables = getSupastashConfig()?.excludeTables?.push || [];
        const tablesToPush = tables.filter((table) => !excludeTables?.includes(table));
        const results = [];
        const jobs = tablesToPush.map((table) => async () => {
            if (tablePushLock.get(table)) {
                results.push({ table, hadWork: false });
                return;
            }
            tablePushLock.set(table, true);
            try {
                const onPush = syncCalls.get(table)?.push;
                const hadWork = await pushLocalDataToRemote(table, onPush);
                results.push({ table, hadWork: !!hadWork });
            }
            catch (e) {
                const msg = e?.code ?? e?.name ?? String(e);
                results.push({ table, hadWork: false, error: msg });
                log(`[Supastash] Push table failed: ${table} — ${msg}`);
            }
            finally {
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
                log(`[Supastash] No pushable data for: ${noSyncTables} (empty passes: ${emptyPassCount})${gap ? ` in the last ${gap}ms` : ""}`);
            }
        }
        else {
            emptyPassCount = 0;
            lastEmptyPassAt = Date.now();
        }
    }
    catch (error) {
        log(`[Supastash] Error pushing local data to remote database: ${error}`);
    }
}
