import { getSupastashConfig } from "../../../core/config";
import log from "../../logs";
import { supastash } from "../../query/builder";
import { supabaseClientErr } from "../../supabaseClientErr";
import { updateLocalSyncedAt } from "../../syncUpdate";
import { parseStringifiedFields } from "./parseFields";
const RANDOM_OLD_DATE = new Date("2000-01-01").toISOString();
const CHUNK_SIZE = 500;
const DEFAULT_DATE = "1970-01-01T00:00:00Z";
async function updateSyncStatus(table, ids) {
    for (const id of ids) {
        await updateLocalSyncedAt(table, id);
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
    const newRemoteIds = new Map();
    ids?.forEach((id) => {
        if (remoteIds.has(id)) {
            newRemoteIds.set(id, remoteIds.get(id));
        }
        else {
            newRemoteIds.set(id, RANDOM_OLD_DATE);
        }
    });
    const toUpsert = [];
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
        if (remoteUpdatedAt &&
            new Date(remoteUpdatedAt || DEFAULT_DATE) > localUpdatedAt) {
            log(`Skipping ${row.id} on table ${table} because remote updated_at is more recent`);
        }
        else {
            const { synced_at, ...rest } = row;
            toUpsert.push(rest);
        }
    }
    if (toUpsert.length > 0) {
        let attempts = 0;
        while (attempts < 5) {
            if (onPushToRemote) {
                const result = await onPushToRemote(toUpsert);
                if (result) {
                    await updateSyncStatus(table, ids);
                    break;
                }
                log(`Upsert attempt ${attempts + 1} failed for table ${table}`, toUpsert?.map((row) => row.id));
            }
            else {
                const { error } = await supabase.from(table).upsert(toUpsert);
                if (!error) {
                    await updateSyncStatus(table, ids);
                    break;
                }
                log(`Upsert attempt ${attempts + 1} failed for table ${table}`, toUpsert?.map((row) => row.id), error);
            }
            // Refresh screen
            const refreshItems = toUpsert?.map((row) => ({
                id: row.id,
                synced_at: new Date().toISOString(),
            }));
            await supastash
                .from(table)
                .upsert(refreshItems)
                .syncMode("localOnly")
                .run();
            await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempts)));
            attempts++;
        }
    }
}
/**
 * Uploads a chunk of data to the remote database
 * @param table - The table to upload to
 * @param unsyncedRecords - The unsynced records to upload
 */
export async function uploadData(table, unsyncedRecords, onPushToRemote) {
    const cleanRecords = unsyncedRecords.map(({ synced_at, deleted_at, ...rest }) => parseStringifiedFields(rest));
    for (let i = 0; i < cleanRecords.length; i += CHUNK_SIZE) {
        const chunk = cleanRecords.slice(i, i + CHUNK_SIZE);
        await uploadChunk(table, chunk, onPushToRemote);
    }
}
