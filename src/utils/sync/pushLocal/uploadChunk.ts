import { getSupastashConfig } from "../../../core/config";
import { PayloadData } from "../../../types/query.types";
import log from "../../logs";
import { supastash } from "../../query/builder";
import { supabaseClientErr } from "../../supabaseClientErr";
import { parseStringifiedFields } from "./parseFields";

const RANDOM_OLD_DATE = new Date("2000-01-01").toISOString();
const CHUNK_SIZE = 500;
const DEFAULT_DATE = "1970-01-01T00:00:00Z";

async function updateSyncStatus(table: string, rows: any[]) {
  const refreshItems = rows?.map((row) => ({
    id: row.id,
    synced_at: new Date().toISOString(),
  }));
  await supastash.from(table).upsert(refreshItems).syncMode("localOnly").run();
}

function errorHandler(
  error: any,
  table: string,
  toUpsert: any[],
  attempts: number
) {
  log(
    `[Supastash] Upsert attempt ${attempts} failed for table ${table}`,
    toUpsert.map((row) => row.id),
    error
  );
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
async function uploadChunk(
  table: string,
  chunk: PayloadData[],
  onPushToRemote?: (payload: any) => Promise<boolean>
) {
  const config = getSupastashConfig();
  const supabase = config.supabaseClient;

  if (!supabase) {
    throw new Error(supabaseClientErr);
  }

  const ids: string[] = chunk.map((row) => row.id);

  // Fetch remote data for the current chunk
  const {
    data: remoteData,
    error,
  }: {
    data: { id: string; updated_at: string }[] | null;
    error: any;
  } = await supabase.from(table).select("id, updated_at").in("id", ids);

  if (error) {
    log(`Error fetching data from table ${table}: ${error.message}`);
    return;
  }

  // Map of remote ids and their updated_at timestamps
  const remoteIds = new Map(remoteData?.map((row) => [row.id, row.updated_at]));

  // Loop through the initial chunk and check if the id is in the remote data
  const newRemoteIds = new Map(
    ids.map((id) => [id, remoteIds.get(id) || RANDOM_OLD_DATE])
  );

  let toUpsert: any[] = [];

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
      log(
        `Skipping ${row.id} on table ${table} because remote updated_at is more recent`
      );
    } else {
      const { synced_at, ...rest } = row;
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
          console.error(
            `[Supastash] Invalid return type from "onPushToRemote" callback on table ${table}.\n
             Expected boolean but received ${typeof result}.\n
             Skipping this chunk.
             Check the "onPushToRemote" callback in the "useSupastashData" hook for table ${table}.
             `
          );
          break;
        }

        if (result) {
          success = true;
        } else {
          attempts++;
          errorHandler(error, table, toUpsert, attempts);
        }
      } else {
        if (config.useCustomRPCForUpserts) {
          const {
            error,
            data,
          }: {
            error: any;
            data: {
              success_ids: string[];
              failed: { id: string; error: string; detail: string }[];
            } | null;
          } = await supabase.rpc("supastash_bulk_upsert", {
            p_table_name: table,
            rows: toUpsert,
          });
          const { success_ids, failed } = data || {};
          if (!error && success_ids?.length === toUpsert.length) {
            success = true;
          } else {
            if (failed?.length && success_ids?.length) {
              toUpsert = toUpsert.filter(
                (row) => !success_ids.includes(row.id)
              );
            }
            attempts++;
            errorHandler({ ...error, failed }, table, toUpsert, attempts);
          }
        } else {
          const { error } = await supabase.from(table).upsert(toUpsert);

          if (!error) {
            success = true;
          } else {
            attempts++;
            errorHandler(error, table, toUpsert, attempts);
          }
        }
      }
      if (success) {
        // Refresh screen
        await updateSyncStatus(table, toUpsert);
        break;
      }

      attempts++;
      if (attempts === 5) {
        log(
          `[Supastash] Final failure after ${attempts} attempts for table ${table}`,
          toUpsert.map((row) => row.id)
        );
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
export async function uploadData(
  table: string,
  unsyncedRecords: PayloadData[],
  onPushToRemote?: (payload: any[]) => Promise<boolean>
) {
  const cleanRecords = unsyncedRecords.map(
    ({ synced_at, deleted_at, ...rest }) => parseStringifiedFields(rest)
  );

  for (let i = 0; i < cleanRecords.length; i += CHUNK_SIZE) {
    const chunk = cleanRecords.slice(i, i + CHUNK_SIZE);
    await uploadChunk(table, chunk, onPushToRemote);
  }
}
