import { SupastashFilter } from "../../../shared/types/realtimeData.types";
import { createTable } from "../../../shared/utils/fetchData/createTable";
import { logError } from "../../../shared/utils/logs";
import { updateLocalDb } from "../sync/pullFromRemote/updateLocalDb";
import { pushLocalDataToRemote } from "../sync/pushLocal/sendUnsyncedToSupabase";

let isInSync = new Map<string, boolean>();

export async function initialFetch(
  table: string,
  filter?: SupastashFilter[],
  onReceiveData?: (payload: any) => Promise<void>,
  onPushToRemote?: (payload: any[]) => Promise<boolean>
) {
  if (isInSync.get(table)) return;
  isInSync.set(table, true);
  try {
    await createTable(table);
    await updateLocalDb(table, filter, onReceiveData);
    await pushLocalDataToRemote(table, onPushToRemote);
  } catch (error) {
    logError(`[Supastash] Error on initial fetch for ${table}`, error);
  } finally {
    isInSync.delete(table);
  }
}
