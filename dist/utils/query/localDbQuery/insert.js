import { getSupastashDb } from "../../../db/dbInitializer";
import { getSafeValue } from "../../serializer";
import { parseStringifiedFields } from "../../sync/pushLocal/parseFields";
import { assertTableExists } from "../../tableValidator";
/**
 * Inserts data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns a data / error object
 */
export async function insertData(table, payload, syncMode, isSingle) {
    if (!table)
        throw new Error("Table name was not provided for an insert call");
    if (!payload)
        throw new Error(`Payload data was not provided for an insert call on ${table}`);
    const timeStamp = new Date().toISOString();
    const inserted = [];
    try {
        await assertTableExists(table);
        const db = await getSupastashDb();
        for (const item of payload) {
            if (!item.id) {
                throw new Error(`Payload must include a valid 'id' field for inserts.`);
            }
            const newPayload = {
                ...item,
                created_at: item.created_at ?? timeStamp,
                updated_at: item.updated_at ?? timeStamp,
                synced_at: Object.prototype.hasOwnProperty.call(item, "synced_at")
                    ? item.synced_at
                    : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
                        ? timeStamp
                        : null,
            };
            const colArray = Object.keys(newPayload);
            const cols = colArray.join(", ");
            const placeholders = colArray.map(() => "?").join(", ");
            const values = colArray.map((c) => getSafeValue(newPayload[c]));
            // Check if record already exist
            const exists = await db.getFirstAsync(`SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`, [newPayload.id]);
            if (exists)
                throw new Error(`Record with id ${newPayload.id} already exists in table ${table}`);
            // Insert data
            await db.runAsync(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
            const insertedRow = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [newPayload.id]);
            if (insertedRow) {
                inserted.push(parseStringifiedFields(insertedRow));
            }
        }
        return {
            error: null,
            data: isSingle ? inserted[0] : inserted,
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
