import { getSupastashDb } from "../../db/dbInitializer";
import { PayloadData } from "../../types/query.types";
import { upsertData } from "../../utils/sync/pullFromRemote/updateLocalDb";
import { checkIfTableExist } from "../../utils/tableValidator";
import log from "../logs";
import { createTable } from "./createTable";

const DEFAULT_DATE = "1970-01-01T00:00:00Z";

export async function receiveData(
  payload: PayloadData,
  table: string,
  setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>,
  setVersion: React.Dispatch<React.SetStateAction<string>>,
  shouldFetch: boolean = true
) {
  if (!shouldFetch) return;

  console.log("🔥 QUEUE HANDLER", payload);

  try {
    const db = await getSupastashDb();
    const exist = await checkIfTableExist(table);

    if (!exist) {
      await createTable(table, payload);
    }

    if (!payload?.id) return;
    log(`[Supastash] Receiving data for ${table} with id ${payload.id}`);

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

    // Update the data
    setDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(payload.id, payload);
      return newMap;
    });

    setVersion(`${table}-${Date.now()}`);

    await upsertData(table, payload);
  } catch (error) {
    console.error("[Supastash] Error receiving data:", error);
  }
}
