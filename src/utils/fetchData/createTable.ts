import { getSupastashConfig } from "../../core/config";
import { getSupastashDb } from "../../db/dbInitializer";
import { PayloadData } from "../../types/query.types";
import log from "../logs";
import { checkIfTableExist } from "../tableValidator";
import { getKeyType } from "./getKeyType";
import { validatePayload } from "./validatePayload";

/**
 * Creates a table in the database
 * @param table - The name of the table to create
 * @param payload - The payload of the table
 */
export async function createTable(table: string, payload?: PayloadData) {
  const db = await getSupastashDb();
  const config = getSupastashConfig();
  let newPayload = payload;

  const isTableExist = await checkIfTableExist(table);

  if (isTableExist) return;
  if (!newPayload && config.supabaseClient) {
    const { data, error } = await config.supabaseClient
      .from(table)
      .select("*")
      .limit(1);
    if (error) {
      log("[Supastash] Error fetching data from supabase", error);
      return;
    }
    newPayload = data?.[0];
  }

  if (!newPayload) {
    log(
      `[Supastash] Can't create table ${table} because no data was found
        Try creating the table manually using the 'defineLocalSchema()' function.
      `
    );
    return;
  }

  try {
    validatePayload(newPayload);
    const columns = Object.keys({ ...newPayload, synced_at: null }).map(
      (key) => `${key} ${getKeyType(newPayload[key])}`
    );
    log("Table to be created", columns);
    // Create the table
    await db.runAsync(
      `CREATE TABLE IF NOT EXISTS ${table} (${columns.join(", ")})`
    );
  } catch (error) {
    throw new Error(
      `Failed to create table ${table}. 
      Use the 'defineLocalSchema()' function to create the table manually.
      Error: ${error}`
    );
  }
}
