import { permanentlyDeleteData } from "../../utils/query/localDbQuery/delete";
import { checkIfTableExist } from "../../utils/tableValidator";
import { supastashEventBus } from "../events/eventBus";
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
        await permanentlyDeleteData(table, [
            { column: "id", operator: "=", value: payload.id },
        ]);
        supastashEventBus.emit(`refresh:${table}`);
    }
    catch (error) {
        console.error("[Supastash] Error receiving data:", error);
    }
}
