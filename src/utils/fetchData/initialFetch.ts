import { RealtimeFilter } from "../../types/realtimeData.types";
import { updateLocalDb } from "../sync/pullFromRemote/updateLocalDb";
import { pushLocalDataToRemote } from "../sync/pushLocal/sendUnsyncedToSupabase";
import { createTable } from "./createTable";

let isInSync = new Map<string, boolean>();

export async function initialFetch(
  table: string,
  filter?: RealtimeFilter,
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
    console.error(`[Supastash] Error on initial fetch for ${table}`, error);
  } finally {
    isInSync.delete(table);
  }
}
