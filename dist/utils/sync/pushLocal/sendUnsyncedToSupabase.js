import { isOnline } from "../../connection";
import { logError } from "../../logs";
import { refreshScreen } from "../../refreshScreenCalls";
import { deleteData } from "./deleteChunks";
import { getAllDeletedData, getAllUnsyncedData } from "./getAllUnsyncedData";
import { uploadData } from "./uploadChunk";
let isInSync = new Map();
/**
 * Sends unsynced data to the remote database for a given table.
 * Returns true if it pushed anything (creates/updates OR deletes), else false.
 */
export async function pushLocalDataToRemote(table, onPushToRemote, noSync) {
    if (isInSync.get(table))
        return;
    isInSync.set(table, true);
    try {
        if (!(await isOnline()))
            return false;
        const data = await getAllUnsyncedData(table);
        const deletedData = await getAllDeletedData(table);
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
        logError(`[Supastash] Error pushing local data to remote for ${table}`, error);
        return false;
    }
    finally {
        isInSync.delete(table);
    }
}
