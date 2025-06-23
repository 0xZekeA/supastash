import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { parseStringifiedFields } from "../../../utils/sync/pushLocal/parseFields";
import { getSafeValue } from "../../serializer";
import { assertTableExists } from "../../tableValidator";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";
const warned = new Set();
/**
 * Updates data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to update
 * @param payload - The payload to update
 * @param filters - The filters to apply to the update query
 * @returns a data / error object
 */
export async function updateData(table, payload, filters, syncMode, isSingle, preserveTimestamp) {
    if (!payload)
        throw new Error(`Payload data was not provided for an update call on ${table}`);
    if (!table)
        throw new Error("Table name was not provided for an update call");
    await assertTableExists(table);
    const timeStamp = new Date().toISOString();
    const newPayload = {
        ...payload,
        synced_at: Object.prototype.hasOwnProperty.call(payload, "synced_at")
            ? payload.synced_at
            : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
                ? timeStamp
                : null,
    };
    if (!preserveTimestamp || payload.updated_at === undefined) {
        if (!warned.has(table) && !getSupastashConfig().debugMode && __DEV__) {
            warned.add(table);
            console.warn(`[Supastash] updated_at not provided for update call on ${table} – defaulting to ${timeStamp}`);
        }
        const userUpdatedAt = payload.updated_at;
        newPayload.updated_at =
            userUpdatedAt !== undefined ? userUpdatedAt : timeStamp;
    }
    const colArray = Object.keys(newPayload);
    const cols = colArray
        .filter((col) => col !== "id")
        .map((col) => `${col} = ?`)
        .join(", ");
    const values = colArray
        .filter((col) => col !== "id")
        .map((c) => getSafeValue(newPayload[c]));
    const { clause, values: filterValues } = buildWhereClause(filters ?? []);
    try {
        const db = await getSupastashDb();
        await db.runAsync(`UPDATE ${table} SET ${cols} ${clause}`, [
            ...values,
            ...filterValues,
        ]);
        const updatedRow = await db.getAllAsync(`SELECT * FROM ${table} ${clause}`, filterValues);
        const result = isSingle && updatedRow
            ? parseStringifiedFields(updatedRow?.[0])
            : !updatedRow
                ? isSingle
                    ? null
                    : []
                : updatedRow?.map(parseStringifiedFields);
        return {
            error: null,
            data: result,
        };
    }
    catch (error) {
        console.error(`[Supastash] ${error}`);
        return {
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
            data: null,
        };
    }
}
