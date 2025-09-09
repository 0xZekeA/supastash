import { getSupastashConfig } from "../../../core/config";
import { syncCalls } from "../../../store/syncCalls";
import { tableFilters } from "../../../store/tableFilters";
import log from "../../../utils/logs";
import { getAllTables } from "../../../utils/sync/getAllTables";
import { runLimitedConcurrency } from "../../../utils/sync/pullFromRemote/runLimitedConcurrency";
import { updateLocalDb } from "../../../utils/sync/pullFromRemote/updateLocalDb";
/**
 * Pulls the data from the remote database to the local database
 */
export async function pullFromRemote() {
    try {
        const tables = await getAllTables();
        if (!tables) {
            log(`[Supastash] No tables found`);
            return;
        }
        const excludeTables = getSupastashConfig()?.excludeTables?.pull || [];
        const tablesToPull = tables.filter((table) => !excludeTables?.includes(table));
        const toPull = tablesToPull.map((table) => async () => {
            try {
                const filter = tableFilters.get(table);
                const onReceiveRecord = syncCalls.get(table)?.pull;
                await updateLocalDb(table, filter, onReceiveRecord);
            }
            catch (e) {
                log(`[Supastash] pull table failed: ${table} — ${e?.code ?? e?.name ?? e}`);
            }
        });
        await runLimitedConcurrency(toPull, 3);
    }
    catch (error) {
        log(`[Supastash] Error pulling from remote: ${error}`);
    }
}
