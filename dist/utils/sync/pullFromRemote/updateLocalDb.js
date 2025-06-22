import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { isOnline } from "../../connection";
import { getTableSchema } from "../../getTableSchema";
import log from "../../logs";
import { refreshScreen } from "../../refreshScreenCalls";
import { updateLocalSyncedAt } from "../../syncUpdate";
import { pullData } from "./pullData";
import { pullDeletedData } from "./pullDeletedData";
import { stringifyComplexFields } from "./stringifyFields";
let isInSync = new Map();
const DEFAULT_DATE = "1970-01-01T00:00:00Z";
/**
 * Updates the local database with the remote changes
 * @param table - The table to update
 */
export async function updateLocalDb(table, filters, onReceiveData) {
    if (isInSync.get(table))
        return;
    isInSync.set(table, true);
    try {
        if (!(await isOnline()))
            return;
        const db = await getSupastashDb();
        const deletedData = await pullDeletedData(table, filters);
        const data = await pullData(table, filters);
        const dataToUpdate = data?.filter((d) => !deletedData?.deletedDataMap.has(d.id));
        const changes = !!deletedData || !!dataToUpdate;
        // Delete records that are no longer in the remote data
        if (deletedData) {
            for (const record of deletedData.records) {
                await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [record.id]);
            }
            refreshScreen(table);
        }
        // Update local database with remote changes
        if (dataToUpdate) {
            for (const record of dataToUpdate) {
                const { doesExist, newer } = await checkIfRecordExistsAndIsNewer(table, record);
                if (newer) {
                    if (onReceiveData) {
                        await onReceiveData(record);
                    }
                    else {
                        await upsertData(table, record, doesExist);
                    }
                }
            }
        }
        if (changes)
            refreshScreen(table);
    }
    catch (error) {
        console.error(`[Supastash] Error updating local db for ${table}`, error);
    }
    finally {
        isInSync.delete(table);
    }
}
const warned = new Map();
/**
 * Upserts a record into the local database
 * @param table - The table to upsert the record into
 * @param record - The record to upsert
 * @param exists - Whether the record already exists in the database
 */
export async function upsertData(table, record, doesExist) {
    if (!record?.id)
        return;
    let itemExists = !!doesExist;
    if (doesExist === undefined) {
        const { doesExist: exists } = await checkIfRecordExistsAndIsNewer(table, record);
        itemExists = exists;
    }
    try {
        const db = await getSupastashDb();
        const columns = await getTableSchema(table);
        const recordToSave = {
            ...stringifyComplexFields(record),
            synced_at: new Date().toISOString(),
        };
        if (__DEV__ && getSupastashConfig().debugMode) {
            const unknownKeys = Object.keys(record).filter((key) => !columns.includes(key));
            if (unknownKeys.length > 0 && !warned.get(table)) {
                warned.set(table, true);
                console.warn(`⚠️ [Supastash] ${table} record contains keys not in local schema: ${unknownKeys.join(", ")}. Data will still be stored`);
            }
        }
        // Prep for upsert
        const keys = columns;
        const placeholders = keys.map(() => "?").join(", ");
        const updateParts = keys
            .filter((key) => key !== "id")
            .map((key) => `${key} = ?`);
        const updatePlaceholders = updateParts.join(", ");
        const values = keys.map((key) => recordToSave[key]);
        const updateValues = keys
            .filter((key) => key !== "id")
            .map((key) => recordToSave[key]);
        if (itemExists) {
            // Update existing record
            await db.runAsync(`UPDATE ${table} SET ${updatePlaceholders} WHERE id = ?`, [...updateValues, record.id]);
        }
        else {
            // Insert new record
            await db.runAsync(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`, values);
        }
        await updateLocalSyncedAt(table, record.id);
        if (doesExist === undefined) {
            refreshScreen(table);
        }
    }
    catch (error) {
        console.error(`[Supastash] Error upserting data for ${table}`, error);
    }
}
async function checkIfRecordExistsAndIsNewer(table, item) {
    if (!item?.id)
        return { doesExist: false, newer: false };
    const db = await getSupastashDb();
    const record = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [
        item.id,
    ]);
    if (record &&
        new Date(record.updated_at || DEFAULT_DATE) >=
            new Date(item.updated_at || DEFAULT_DATE)) {
        log(`Skipping ${table}:${record.id} - local is newer`);
        return { doesExist: true, newer: false };
    }
    return { doesExist: !!record, newer: true };
}
