import { getSupastashDb } from "../../../db/dbInitializer";
import { generateUUIDv4 } from "../../../utils/genUUID";
import { getSafeValue } from "../../serializer";
import { parseStringifiedFields } from "../../sync/pushLocal/parseFields";
import { assertTableExists } from "../../tableValidator";
/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export async function upsertData(table, payload, syncMode, isSingle, onConflictKeys = ["id"]) {
    if (!payload || !table)
        throw new Error("Table and payload are required for upsert.");
    await assertTableExists(table);
    const timeStamp = new Date().toISOString();
    const items = Array.isArray(payload) ? payload : [payload];
    const upserted = [];
    try {
        const db = await getSupastashDb();
        for (const item of items) {
            const newPayload = {
                ...item,
                updated_at: item.updated_at ?? timeStamp,
                synced_at: Object.prototype.hasOwnProperty.call(item, "synced_at")
                    ? item.synced_at
                    : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
                        ? timeStamp
                        : null,
            };
            const colArray = Object.keys(newPayload);
            const includesConflictKeys = onConflictKeys.some((key) => colArray.includes(key));
            if (!includesConflictKeys) {
                throw new Error(`onConflictKeys must include at least one key from the payload. Payload: ${JSON.stringify(newPayload)}`);
            }
            const whereClause = onConflictKeys
                .map((key) => `${key} = ?`)
                .join(" AND ");
            const conflictValues = onConflictKeys.map((key) => getSafeValue(newPayload[key]));
            const existingData = await db.getAllAsync(`SELECT * FROM ${table} WHERE ${whereClause}`, [...conflictValues]);
            if (existingData.length > 0) {
                if (existingData.length > 1) {
                    throw new Error(`Multiple rows matched onConflictKeys in '${table}' — expected unique constraint. Payload: ${JSON.stringify(newPayload)}`);
                }
                const updateColsArray = Object.keys(newPayload);
                const updateCols = updateColsArray
                    .filter((col) => !onConflictKeys.includes(col))
                    .map((col) => `${col} = ?`)
                    .join(", ");
                const updateValues = updateColsArray
                    .filter((col) => !onConflictKeys.includes(col))
                    .map((c) => getSafeValue(newPayload[c]));
                const updateSql = `UPDATE ${table} SET ${updateCols} WHERE ${whereClause}`;
                await db.runAsync(updateSql, [...updateValues, ...conflictValues]);
                upserted.push(parseStringifiedFields(newPayload));
            }
            else {
                const insertPayload = {
                    ...newPayload,
                    id: newPayload.id ?? generateUUIDv4(),
                    created_at: newPayload.created_at ?? timeStamp,
                };
                const newColsArray = Object.keys(insertPayload);
                const insertCols = newColsArray.join(", ");
                const insertPlaceholders = newColsArray.map(() => "?").join(", ");
                const insertValues = newColsArray.map((c) => getSafeValue(insertPayload[c]));
                const insertSql = `INSERT INTO ${table} (${insertCols}) VALUES (${insertPlaceholders})`;
                await db.runAsync(insertSql, insertValues);
                const inserted = await db.getFirstAsync(`SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`, [...conflictValues]);
                if (inserted)
                    upserted.push(parseStringifiedFields(inserted));
            }
        }
        return {
            error: null,
            data: isSingle ? upserted[0] : upserted,
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
