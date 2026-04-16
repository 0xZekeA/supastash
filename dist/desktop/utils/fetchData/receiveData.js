import { getSupastashDb } from "../../../shared/db/dbInitializer";
import { createTable } from "../../../shared/utils/fetchData/createTable";
import log, { logError } from "../../../shared/utils/logs";
import { refreshScreen } from "../../../shared/utils/refreshScreenCalls";
import { checkIfTableExist } from "../../../shared/utils/tableValidator";
import { upsertData } from "../sync/pullFromRemote/updateLocalDb";
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
        const existingData = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [payload.id]);
        if (existingData &&
            new Date(existingData.updated_at || DEFAULT_DATE).getTime() >=
                new Date(payload.updated_at || DEFAULT_DATE).getTime()) {
            return;
        }
        log(`[Supastash] Receiving data for ${table} with id ${payload.id}`);
        log(`[Supastash] Payload:`, payload);
        // Update the data
        if (upsertCall) {
            await upsertCall(payload);
        }
        else {
            await upsertData({ table, record: payload });
        }
        refreshScreen(table);
    }
    catch (error) {
        logError("[Supastash] Error receiving data:", error);
    }
}
