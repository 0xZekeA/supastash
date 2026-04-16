import { getSupastashConfig } from "../../../../shared/core/config";
import { refreshScreen } from "../../../../shared/utils/refreshScreenCalls";
import { deleteData } from "../../../../shared/utils/sync/pushLocal/deleteChunks";
import { getAllDeletedData, getAllUnsyncedData, } from "../../../../shared/utils/sync/pushLocal/getAllUnsyncedData";
import { SyncInfoUpdater } from "../../../../shared/utils/sync/queryStatus";
import { uploadData } from "./uploadChunk";
let isInSync = new Map();
/**
 * Sends unsynced data to the remote database for a given table.
 * Returns true if it pushed anything (creates/updates OR deletes), else false.
 */
export async function pushLocalDataToRemote(table, onPushToRemote, noSync) {
    if (isInSync.get(table))
        return;
    const cfg = getSupastashConfig();
    if (cfg.supastashMode === "ghost")
        return false;
    isInSync.set(table, true);
    try {
        const data = await getAllUnsyncedData(table);
        const deletedData = await getAllDeletedData(table);
        SyncInfoUpdater.setUnsyncedDataCount({
            amount: data?.length ?? 0,
            type: "push",
            table,
        });
        SyncInfoUpdater.setUnsyncedDeletedCount({
            amount: deletedData?.length ?? 0,
            type: "push",
            table,
        });
        const hasData = !!data?.length;
        const hasDeletes = !!deletedData?.length;
        if (!hasData && !hasDeletes) {
            noSync?.push?.(table);
            return false;
        }
        let didWork = false;
        if (hasData) {
            await uploadData(table, data, onPushToRemote);
            didWork = true;
        }
        if (hasDeletes) {
            await deleteData(table, deletedData);
            didWork = true;
        }
        if (didWork)
            refreshScreen(table);
        return didWork;
    }
    catch (error) {
        throw error;
    }
    finally {
        isInSync.delete(table);
    }
}
