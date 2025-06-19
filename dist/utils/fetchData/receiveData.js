import { getSupastashDb } from "../../db/dbInitializer";
import { upsertData } from "../../utils/sync/pullFromRemote/updateLocalDb";
import { checkIfTableExist } from "../../utils/tableValidator";
import { supastashEventBus } from "../events/eventBus";
import log from "../logs";
import { createTable } from "./createTable";
const DEFAULT_DATE = "1970-01-01T00:00:00Z";
export async function receiveData(payload, table, shouldFetch = true, upsertCall) {
    if (!shouldFetch)
        return;
    try {
        const db = await getSupastashDb();
        const exist = await checkIfTableExist(table);
        if (!exist) {
            await createTable(table, payload);
        }
        if (!payload?.id)
            return;
        log(`[Supastash] Receiving data for ${table} with id ${payload.id}`);
        const existingData = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [payload.id]);
        if (existingData &&
            new Date(existingData.updated_at || DEFAULT_DATE).getTime() >=
                new Date(payload.updated_at || DEFAULT_DATE).getTime()) {
            return;
        }
        // Update the data
        if (upsertCall) {
            await upsertCall(payload);
        }
        else {
            await upsertData(table, payload);
        }
        supastashEventBus.emit(`refresh:${table}`);
    }
    catch (error) {
        console.error("[Supastash] Error receiving data:", error);
    }
}
