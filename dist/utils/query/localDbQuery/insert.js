import { logError } from "../../logs";
import { assertTableExists } from "../../tableValidator";
import { insertMany } from "../helpers/localDb/insertMany";
/**
 * Inserts data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns a data / error object
 */
export async function insertData(state) {
    const { table, tx, type: syncMode, isSingle, withTx, payload, } = state;
    try {
        if (!payload)
            throw new Error(`[Supastash] Payload data was not provided for an insert call on ${table}`);
        await assertTableExists(table);
        const inserted = await insertMany(payload, {
            table,
            syncMode,
            returnInsertedRows: true,
            withTx: withTx,
            tx,
        });
        return {
            error: null,
            data: isSingle ? inserted?.[0] : inserted,
        };
    }
    catch (error) {
        logError(`[Supastash] ${error}`);
        if (state.throwOnError)
            throw error;
        return {
            error: {
                message: error instanceof Error ? error.message : String(error),
            },
            data: null,
        };
    }
}
