import { isOnline } from "../../connection";
import { logError } from "../../logs";
import { refreshScreen } from "../../refreshScreenCalls";
import { deleteData } from "./deleteChunks";
import { getAllDeletedData, getAllUnsyncedData } from "./getAllUnsyncedData";
import { uploadData } from "./uploadChunk";
let isInSync = new Map();
/**
 * Sends unsynced data to the remote database for a given table
 * @param table - The table to send the data to
 */
export async function pushLocalDataToRemote(table, onPushToRemote, noSync) {
    if (isInSync.get(table))
        return;
    isInSync.set(table, true);
    try {
        if (!(await isOnline()))
            return;
        const data = await getAllUnsyncedData(table);
        const deletedData = await getAllDeletedData(table);
        if ((!data || data.length === 0) &&
            (!deletedData || deletedData.length === 0)) {
            noSync?.push(table);
            return;
        }
        if (data && data.length > 0) {
            await uploadData(table, data, onPushToRemote);
            refreshScreen(table);
        }
        if (deletedData && deletedData.length > 0) {
            await deleteData(table, deletedData);
        }
    }
    catch (error) {
        logError(`[Supastash] Error pushing local data to remote for ${table}`, error);
    }
    finally {
        isInSync.delete(table);
    }
}
