import { getSupastashDb } from "../../db/dbInitializer";
import { PayloadData } from "../../types/query.types";
import { upsertData } from "../../utils/sync/pullFromRemote/updateLocalDb";
import { checkIfTableExist } from "../../utils/tableValidator";
import log, { logError } from "../logs";
import { refreshScreen } from "../refreshScreenCalls";
import { createTable } from "./createTable";

const DEFAULT_DATE = "1970-01-01T00:00:00Z";

export async function receiveData(
  payload: PayloadData,
  table: string,
  shouldFetch: boolean = true,
  upsertCall?: (item: any) => void | Promise<void>
) {
  if (!shouldFetch) return;

  try {
    const db = await getSupastashDb();
    const exist = await checkIfTableExist(table);

    if (!exist) {
      await createTable(table, payload);
    }

    if (!payload?.id) return;

    const existingData = await db.getFirstAsync(
      `SELECT * FROM ${table} WHERE id = ?`,
      [payload.id]
    );

    if (
      existingData &&
      new Date(existingData.updated_at || DEFAULT_DATE).getTime() >=
        new Date(payload.updated_at || DEFAULT_DATE).getTime()
    ) {
      return;
    }
    log(`[Supastash] Receiving data for ${table} with id ${payload.id}`);
    log(`[Supastash] Payload:`, payload);

    // Update the data
    if (upsertCall) {
      await upsertCall(payload);
    } else {
      await upsertData(table, payload);
    }
    refreshScreen(table);
  } catch (error) {
    logError("[Supastash] Error receiving data:", error);
  }
}
