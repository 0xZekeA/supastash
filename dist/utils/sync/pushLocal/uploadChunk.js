import { getSupastashConfig } from "../../../core/config";
import { supastashEventBus } from "../../events/eventBus";
import log, { logError } from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { updateLocalSyncedAt } from "../../syncUpdate";
import { setQueryStatus } from "../queryStatus";
import { parseStringifiedFields } from "./parseFields";
const RANDOM_OLD_DATE = new Date("2000-01-01").toISOString();
const CHUNK_SIZE = 500;
const DEFAULT_DATE = "1970-01-01T00:00:00Z";
async function updateSyncStatus(table, rows) {
    for (const row of rows) {
        await updateLocalSyncedAt(table, row.id);
    }
}
function errorHandler(error, table, toUpsert, attempts) {
    for (const row of toUpsert) {
        setQueryStatus(row.id, table, "error");
    }
    if (attempts === 5) {
        log(`[Supastash] Upsert attempt ${attempts} failed for table ${table} \n
     Error: ${error.message} \n
     To Upsert: ${toUpsert.map((row) => row.id).join(", ")} \n
     You can write a custom 'onPushToRemote' callback to handle this error.
     Check the "onPushToRemote" callback in the "useSupastashData" hook for table ${table}.
     Also, callback should return a boolean, if successfully pushed to remote.
     `);
    }
}
/**
 * Uploads a chunk of data to the remote database
 *
 * It will check if the data in the remote database is more recent than the data in the local database.
 * If it is, it will skip it.
 * If it is not, it will upsert it.
 *
 * @param table - The table to upload to
 * @param chunk - The chunk of data to upload
 */
async function uploadChunk(table, chunk, onPushToRemote) {
    const config = getSupastashConfig();
    const supabase = config.supabaseClient;
    if (!supabase) {
        throw new Error(supabaseClientErr);
    }
    const ids = chunk.map((row) => row.id);
    // Fetch remote data for the current chunk
    const { data: remoteData, error, } = await supabase.from(table).select("id, updated_at").in("id", ids);
    if (error) {
        log(`Error fetching data from table ${table}: ${error.message}`);
        return;
    }
    // Map of remote ids and their updated_at timestamps
    const remoteIds = new Map(remoteData?.map((row) => [row.id, row.updated_at]));
    // Loop through the initial chunk and check if the id is in the remote data
    const newRemoteIds = new Map(ids.map((id) => [id, remoteIds.get(id) || RANDOM_OLD_DATE]));
    let toUpsert = [];
    for (const row of chunk) {
        if (!row.id) {
            log(`Skipping ${row.id} on table ${table} because no id found`);
            continue;
        }
        if (!row.updated_at) {
            log(`Skipping ${row.id} on table ${table} because no updated_at found`);
            continue;
        }
        // Check if the remote updated_at is more recent than the local updated_at
        const remoteUpdatedAt = newRemoteIds.get(row.id);
        const localUpdatedAt = new Date(row.updated_at || DEFAULT_DATE);
        if (remoteUpdatedAt && new Date(remoteUpdatedAt) > localUpdatedAt) {
            log(`Skipping ${row.id} on table ${table} because remote updated_at is more recent`);
        }
        else {
            const { synced_at, ...rest } = row;
            setQueryStatus(rest.id, table, "pending");
            toUpsert.push(rest);
        }
    }
    if (toUpsert.length > 0) {
        let attempts = 0;
        while (attempts < 5 && toUpsert.length > 0) {
            let success = false;
            if (onPushToRemote) {
                const result = await onPushToRemote(toUpsert);
                if (typeof result !== "boolean") {
                    logError(`[Supastash] Invalid return type from "onPushToRemote" callback on table ${table}.\n
             Expected boolean but received ${typeof result}.\n
             Skipping this chunk.
             Check the "onPushToRemote" callback in the "useSupastashData" hook for table ${table}.
             `);
                    break;
                }
                if (result) {
                    for (const row of toUpsert) {
                        setQueryStatus(row.id, table, "success");
                    }
                    success = true;
                }
                else {
                    attempts++;
                    errorHandler(error, table, toUpsert, attempts);
                }
            }
            else {
                const { error } = await supabase.from(table).upsert(toUpsert);
                if (!error) {
                    for (const row of toUpsert) {
                        setQueryStatus(row.id, table, "success");
                    }
                    supastashEventBus.emit("updateSyncStatus");
                    success = true;
                }
                else {
                    attempts++;
                    errorHandler(error, table, toUpsert, attempts);
                }
            }
            if (success) {
                // Refresh screen
                await updateSyncStatus(table, toUpsert);
                break;
            }
            attempts++;
            if (attempts === 5) {
                log(`[Supastash] Final failure after ${attempts} attempts for table ${table}`, toUpsert.map((row) => row.id));
                break;
            }
            await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempts)));
        }
    }
}
/**
 * Uploads a chunk of data to the remote database
 * @param table - The table to upload to
 * @param unsyncedRecords - The unsynced records to upload
 */
export async function uploadData(table, unsyncedRecords, onPushToRemote) {
    const cleanRecords = unsyncedRecords.map(({ synced_at, deleted_at, ...rest }) => {
        return parseStringifiedFields(rest);
    });
    for (let i = 0; i < cleanRecords.length; i += CHUNK_SIZE) {
        const chunk = cleanRecords.slice(i, i + CHUNK_SIZE);
        await uploadChunk(table, chunk, onPushToRemote);
    }
}
