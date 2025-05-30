import log from "../../logs";
import { deleteData } from "./deleteChunks";
import { getAllDeletedData, getAllUnsyncedData } from "./getAllUnsyncedData";
import { uploadData } from "./uploadChunk";

/**
 * Sends unsynced data to the remote database for a given table
 * @param table - The table to send the data to
 */
export async function pushLocalDataToRemote(table: string) {
  const data = await getAllUnsyncedData(table);
  const deletedData = await getAllDeletedData(table);

  if (
    (!data || data.length === 0) &&
    (!deletedData || deletedData.length === 0)
  ) {
    log(`No unsynced data found for table ${table}`);
    return;
  }

  if (data && data.length > 0) {
    await uploadData(table, data);
  }

  const payloadForDeletedData = deletedData?.map((item) => ({
    id: item.id,
    deleted_at: item.deleted_at,
  }));

  if (payloadForDeletedData && payloadForDeletedData.length > 0) {
    await deleteData(table, payloadForDeletedData);
  }
}
