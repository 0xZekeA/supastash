import { updateLocalDb } from "../sync/pullFromRemote/updateLocalDb";
import { pushLocalDataToRemote } from "../sync/pushLocal/sendUnsyncedToSupabase";
import { createTable } from "./createTable";
let isInSync = new Map();
export async function initialFetch(table, filter, onReceiveData, onPushToRemote) {
    if (isInSync.get(table))
        return;
    isInSync.set(table, true);
    try {
        await createTable(table);
        await updateLocalDb(table, filter, onReceiveData);
        await pushLocalDataToRemote(table, onPushToRemote);
    }
    catch (error) {
        console.error(`[Supastash] Error on initial fetch for ${table}`, error);
    }
    finally {
        isInSync.delete(table);
    }
}
