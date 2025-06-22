import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { PayloadData } from "../../../types/query.types";
import log from "../../logs";
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
    await db.runAsync(`DELETE FROM ${table} WHERE id = ${row.id}`);
  }
}

function errorHandler(error: any, table: string, attempts: number) {
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
        rows: toDelete,
      });
      const { success_ids, failed } = data || {};

      if (!error && success_ids?.length === toDelete.length) {
        await permanentlyDeleteChunkLocally(table, toDelete);
        break;
      } else {
        if (success_ids?.length) {
          const remaining = [];
          const toBeDeleted = [];
          for (const row of toDelete) {
            if (success_ids.includes(row.id)) {
              toBeDeleted.push(row);
            } else {
              remaining.push(row);
            }
          }
          toDelete = remaining;
          await permanentlyDeleteChunkLocally(table, toBeDeleted);
        }
        errorHandler({ ...error, failed }, table, attempts);
      }
    } else {
      const { error } = await supabase.from(table).upsert(toDelete);
      if (!error) {
        await permanentlyDeleteChunkLocally(table, toDelete);
        break;
      }
      errorHandler(error, table, attempts);
    }
    await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempts)));
    attempts++;
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
  const cleanRecords = unsyncedRecords.map(
    ({ synced_at, deleted_at, ...rest }) => parseStringifiedFields(rest)
  );

  for (let i = 0; i < cleanRecords.length; i += CHUNK_SIZE) {
    const chunk = cleanRecords.slice(i, i + CHUNK_SIZE);
    await deleteChunk(table, chunk);
  }
}
