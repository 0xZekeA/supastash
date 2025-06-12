import { isOnline } from "../../connection";
import { supastashEventBus } from "../../events/eventBus";
import { deleteData } from "./deleteChunks";
import { getAllDeletedData, getAllUnsyncedData } from "./getAllUnsyncedData";
import { uploadData } from "./uploadChunk";

let isInSync = new Map<string, boolean>();

/**
 * Sends unsynced data to the remote database for a given table
 * @param table - The table to send the data to
 */
export async function pushLocalDataToRemote(
  table: string,
  onPushToRemote?: (payload: any[]) => Promise<boolean>,
  noSync?: string[]
) {
  if (isInSync.get(table)) return;
  isInSync.set(table, true);
  try {
    if (!(await isOnline())) return;
    const data = await getAllUnsyncedData(table);
    const deletedData = await getAllDeletedData(table);

    if (
      (!data || data.length === 0) &&
      (!deletedData || deletedData.length === 0)
    ) {
      noSync?.push(table);
      return;
    }

    if (data && data.length > 0) {
      await uploadData(table, data, onPushToRemote);
      supastashEventBus.emit(`push:${table}`, data, "insert");
    }

    const payloadForDeletedData = deletedData?.map((item) => ({
      id: item.id,
      deleted_at: item.deleted_at,
    }));

    if (payloadForDeletedData && payloadForDeletedData.length > 0) {
      await deleteData(table, payloadForDeletedData);
    }
  } catch (error) {
    console.error(
      `[Supastash] Error pushing local data to remote for ${table}`,
      error
    );
  } finally {
    isInSync.delete(table);
  }
}
