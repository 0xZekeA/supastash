import { getSupastashDb } from "../../db/dbInitializer";
import { PayloadData } from "../../types/query.types";
import log from "../logs";
import { getRemoteTableSchema } from "../sync/status/remoteSchema";
import { checkIfTableExist } from "../tableValidator";
import { mapPgTypeToSQLite } from "./getKeyType";
import { validatePayload } from "./validatePayload";

/**
 * Creates a table in the database
 * @param table - The name of the table to create
 * @param payload - The payload of the table
 */
export async function createTable(table: string, payload?: PayloadData) {
  const db = await getSupastashDb();
  let newPayload = payload;

  const isTableExist = await checkIfTableExist(table);

  if (isTableExist) return;

  const tableSchema = await getRemoteTableSchema(table);

  if (!tableSchema) {
    throw new Error(
      `[Supastash] Can't create table ${table} because no data was found
        Try creating the table manually using the 'defineLocalSchema()' function.
      `
    );
  }

  const columns = tableSchema.map((col) => {
    return `${col.column_name} ${mapPgTypeToSQLite(col.data_type)} ${
      col.column_name === "id" ? "PRIMARY KEY" : ""
    } ${col.is_nullable === "YES" ? "" : "NOT NULL"}`;
  });

  validatePayload(newPayload);
  try {
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
