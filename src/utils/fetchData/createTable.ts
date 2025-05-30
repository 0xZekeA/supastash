import { getSupaStashDb } from "@/db/dbInitializer";
import { PayloadData } from "@/types/query.types";
import { getKeyType } from "./getKeyType";
import { validatePayload } from "./validatePayload";

/**
 * Creates a table in the database
 * @param table - The name of the table to create
 * @param payload - The payload of the table
 */
export async function createTable(table: string, payload: PayloadData) {
  const db = await getSupaStashDb();

  validatePayload(payload);

  const columns = Object.keys(payload).map(
    (key) => `${key} ${getKeyType(payload[key])}`
  );
  try {
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
