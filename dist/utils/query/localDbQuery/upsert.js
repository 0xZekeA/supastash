import { logError } from "../../logs";
import { assertTableExists } from "../../tableValidator";
import { upsertMany } from "../helpers/localDb/upsertMany";
const warned = new Set();
/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export async function upsertData(table, payload, syncMode, isSingle, onConflictKeys = ["id"], preserveTimestamp) {
    if (!payload || !table)
        throw new Error("Table and payload are required for upsert.");
    await assertTableExists(table);
    const items = Array.isArray(payload) ? payload : [payload];
    try {
        const upserted = await upsertMany(items, {
            table,
            syncMode,
            returnRows: true,
            onConflictKeys,
            preserveTimestamp,
        });
        return {
            error: null,
            data: isSingle ? upserted?.[0] : upserted,
        };
    }
    catch (error) {
        logError(`[Supastash] ${error}`);
        return {
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
            data: null,
        };
    }
}
