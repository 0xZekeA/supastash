import { permanentlyDeleteData } from "../../utils/query/localDbQuery/delete";
import { checkIfTableExist } from "../../utils/tableValidator";
import { logError } from "../logs";
import { refreshScreen } from "../refreshScreenCalls";
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
