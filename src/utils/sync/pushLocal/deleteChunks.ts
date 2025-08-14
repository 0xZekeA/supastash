import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { PayloadData } from "../../../types/query.types";
import { supastashEventBus } from "../../events/eventBus";
import log from "../../logs";
import { setQueryStatus } from "../queryStatus";
import { parseStringifiedFields } from "./parseFields";

const CHUNK_SIZE = 500;

/**
 * Permanently deletes a chunk of data from the local database
 * @param table - The table to delete from
 * @param chunk - The chunk of data to delete
 */
async function permanentlyDeleteChunkLocally(
  table: string,
  chunk: PayloadData[]
) {
  const db = await getSupastashDb();

  for (const row of chunk) {
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
  }
}

function errorHandler(
  error: any,
  table: string,
  attempts: number,
  toDelete: PayloadData[]
) {
  for (const row of toDelete) {
    setQueryStatus(row.id, table, "error");
  }
  log(
    `Delete attempt ${
      attempts + 1
    } failed for a delete operation on table ${table}`,
    error
  );
}

/**
 * Deletes a chunk of data from the remote database
 * @param table - The table to delete from
 * @param chunk - The chunk of data to delete
 */
async function deleteChunk(table: string, chunk: PayloadData[]) {
  let toDelete = chunk;
  const config = getSupastashConfig();
  const supabase = config.supabaseClient;

  if (!supabase) {
    throw new Error("No supabase client found");
  }

  let attempts = 0;
  while (attempts < 3) {
    const { error } = await supabase.from(table).upsert(toDelete);
    if (!error) {
      for (const row of toDelete) {
        setQueryStatus(row.id, table, "success");
      }
      supastashEventBus.emit("updateSyncStatus");
      await permanentlyDeleteChunkLocally(table, toDelete);
      break;
    }
    errorHandler(error, table, attempts, toDelete);

    attempts++;
    await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempts)));
  }
}

/**
 * Deletes a chunk of data from the remote database
 * @param table - The table to delete from
 * @param unsyncedRecords - The unsynced records to delete
 */
export async function deleteData(
  table: string,
  unsyncedRecords: PayloadData[]
) {
  const cleanRecords = unsyncedRecords.map(({ synced_at, ...rest }) => {
    setQueryStatus(rest.id, table, "pending");
    return parseStringifiedFields(rest);
  });

  for (let i = 0; i < cleanRecords.length; i += CHUNK_SIZE) {
    const chunk = cleanRecords.slice(i, i + CHUNK_SIZE);
    await deleteChunk(table, chunk);
  }
}
