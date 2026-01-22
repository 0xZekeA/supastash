import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { supastashEventBus } from "../../events/eventBus";
import log from "../../logs";
import { setQueryStatus } from "../queryStatus";
const CHUNK_SIZE = 500;
const SQL_CHUNK = 999;
/**
 * Permanently deletes a chunk of data from the local database
 * @param table - The table to delete from
 * @param chunk - The chunk of data to delete
 */
async function permanentlyDeleteLocally(table, ids) {
    const db = await getSupastashDb();
    for (let i = 0; i < ids.length; i += SQL_CHUNK) {
        const slice = ids.slice(i, i + SQL_CHUNK);
        const placeholders = slice.map(() => "?").join(", ");
        await db.runAsync(`DELETE FROM ${table} WHERE id IN (${placeholders})`, slice);
    }
}
/**
 * Deletes a chunk of data from the remote database
 * @param table - The table to delete from
 * @param chunk - The chunk of data to delete
 */
async function deleteChunkRemote(table, ids) {
    const config = getSupastashConfig();
    const supabase = config.supabaseClient;
    if (!supabase) {
        throw new Error("No supabase client found");
    }
    const timeStamp = new Date().toISOString();
    let attempts = 0;
    while (attempts < 3) {
        const { error } = await supabase
            .from(table)
            .update({
            deleted_at: timeStamp,
            updated_at: timeStamp,
        })
            .in("id", ids);
        if (!error)
            return;
        attempts++;
        log(`Delete attempt ${attempts} failed for table ${table}`, error);
        await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempts)));
    }
    throw new Error(`Remote delete failed after retries for table ${table} ${ids.join(", ")}`);
}
/**
 * Deletes a chunk of data from the remote database
 * @param table - The table to delete from
 * @param unsyncedRecords - The unsynced records to delete
 */
export async function deleteData(table, unsyncedRecords) {
    const ids = unsyncedRecords.map(({ id }) => {
        setQueryStatus(id, table, "pending");
        return id;
    });
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunkIds = ids.slice(i, i + CHUNK_SIZE);
        await deleteChunkRemote(table, chunkIds);
        for (const id of chunkIds)
            setQueryStatus(id, table, "success");
        supastashEventBus.emit("updateSyncStatus");
        await permanentlyDeleteLocally(table, chunkIds);
    }
}
