import { isOnline } from "../../connection";
import { refreshScreen } from "../../refreshScreenCalls";
import { SyncInfoUpdater } from "../queryStatus";
import { deleteData } from "./deleteChunks";
import { getAllDeletedData, getAllUnsyncedData } from "./getAllUnsyncedData";
import { uploadData } from "./uploadChunk";

let isInSync = new Map<string, boolean>();

/**
 * Sends unsynced data to the remote database for a given table.
 * Returns true if it pushed anything (creates/updates OR deletes), else false.
 */
export async function pushLocalDataToRemote(
  table: string,
  onPushToRemote?: (payload: any[]) => Promise<boolean>,
  noSync?: string[]
) {
  if (isInSync.get(table)) return;
  isInSync.set(table, true);
  try {
    if (!(await isOnline())) return false;
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

    if (didWork) refreshScreen(table);
    return didWork;
  } catch (error) {
    throw error;
  } finally {
    isInSync.delete(table);
  }
}
