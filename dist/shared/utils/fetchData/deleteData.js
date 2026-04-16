import { logError } from "../logs";
import { permanentlyDeleteData } from "../query/localDbQuery/delete";
import { refreshScreen } from "../refreshScreenCalls";
import { checkIfTableExist } from "../tableValidator";
import { createTable } from "./createTable";
export async function deleteData(payload, table, shouldFetch = true) {
    if (!shouldFetch)
        return;
    try {
        const exist = await checkIfTableExist(table);
        if (!exist) {
            await createTable(table, payload);
        }
        if (!payload?.id)
            return;
        // Delete the data
        await permanentlyDeleteData({
            table,
            filters: [{ column: "id", operator: "=", value: payload.id }],
            tx: null,
            throwOnError: true,
        });
        refreshScreen(table);
    }
    catch (error) {
        logError("[Supastash] Error receiving data:", error);
    }
}
