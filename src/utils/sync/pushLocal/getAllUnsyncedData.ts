import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { tableSchemaData } from "../../../store/tableSchemaData";
import { PayloadData } from "../../../types/query.types";
import { getTableSchema } from "../../../utils/getTableSchema";
import log from "../../../utils/logs";
import { supabaseClientErr } from "../../supabaseClientErr";

const numberOfErrors = new Map<string, number>();
const sharedKeysCache = new Map<string, string[]>();

async function getRemoteKeys(table: string): Promise<string[] | null> {
  const config = getSupastashConfig();
  const supabase = config?.supabaseClient;

  if (!supabase) {
    throw new Error(`Supabase client not found, ${supabaseClientErr}`);
  }

  if (sharedKeysCache.has(table)) {
    return sharedKeysCache.get(table)!;
  }

  if (numberOfErrors.get(table) && (numberOfErrors.get(table) || 0) > 3) {
    return null;
  }

  if (!tableSchemaData.has(table)) {
    const { data, error } = await supabase.rpc("get_table_schema", {
      table_name: table,
    });
    if (error) {
      log(
        `[Supastash] Error getting remote keys for table ${table} on public schema: ${error.message}`
      );
      numberOfErrors.set(table, (numberOfErrors.get(table) || 0) + 1);
      return null;
    }
    tableSchemaData.set(table, data);
  }

  if (!tableSchemaData.get(table)) {
    return null;
  }

  const keys = (tableSchemaData.get(table) as { column_name: string }[])?.map(
    (item) => item.column_name
  );
  const columns = await getTableSchema(table);
  const sharedKeys = keys?.filter((key) => columns.includes(key));
  const missingKeys = columns.filter(
    (column) => !keys?.includes(column) && column !== "synced_at"
  );

  // Inform user of missing keys
  if (missingKeys.length > 0) {
    log(
      `[Supastash] Missing keys for table ${table} on public schema: ${missingKeys.join(
        ", "
      )}`
    );
  }

  // Return shared keys if they exist
  if (sharedKeys) {
    sharedKeysCache.set(table, sharedKeys);
    return sharedKeys;
  }

  return null;
}

/**
 * Gets all unsynced data from a table
 * @param table - The table to get the data from
 * @returns The unsynced data
 */
export async function getAllUnsyncedData(
  table: string
): Promise<PayloadData[] | null> {
  const db = await getSupastashDb();

  const remoteKeys = await getRemoteKeys(table);

  if (!remoteKeys) {
    const query = `SELECT * FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL`;
    const data: PayloadData[] | null = await db.getAllAsync(query);
    return data ?? null;
  }

  const columns = remoteKeys.join(", ");
  const query = `SELECT ${columns} FROM ${table} WHERE synced_at IS NULL AND deleted_at IS NULL`;
  const data: PayloadData[] | null = await db.getAllAsync(query);
  return data ?? null;
}

/**
 * Gets all deleted data from a table
 * @param table - The table to get the data from
 * @returns The deleted data
 */
export async function getAllDeletedData(
  table: string
): Promise<PayloadData[] | null> {
  const db = await getSupastashDb();
  const data: PayloadData[] | null = await db.getAllAsync(
    `SELECT deleted_at, id FROM ${table} WHERE deleted_at IS NOT NULL`
  );
  return data ?? null;
}
