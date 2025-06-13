import { getSupastashConfig } from "../../core/config";
import { getSupastashDb } from "../../db/dbInitializer";
import { tableSchemaData } from "../../store/tableSchemaData";
import log from "../logs";
import { supabaseClientErr } from "../supabaseClientErr";
import { checkIfTableExist } from "../tableValidator";
import { mapPgTypeToSQLite } from "./getKeyType";
import { validatePayload } from "./validatePayload";
let errorCount = new Map();
async function getTableSchema(table) {
    const config = getSupastashConfig();
    const supabase = config?.supabaseClient;
    if (!supabase) {
        throw new Error(`Supabase client not found, ${supabaseClientErr}`);
    }
    if (tableSchemaData.has(table)) {
        return tableSchemaData.get(table);
    }
    if (errorCount.get(table) && (errorCount.get(table) || 0) > 3) {
        return null;
    }
    const { data, error } = await supabase.rpc("get_table_schema", {
        table_name: table,
    });
    if (error) {
        log(`[Supastash] Error getting table schema for table ${table}: ${error.message}`);
        errorCount.set(table, (errorCount.get(table) || 0) + 1);
        return null;
    }
    tableSchemaData.set(table, data);
    return data;
}
/**
 * Creates a table in the database
 * @param table - The name of the table to create
 * @param payload - The payload of the table
 */
export async function createTable(table, payload) {
    const db = await getSupastashDb();
    let newPayload = payload;
    const isTableExist = await checkIfTableExist(table);
    if (isTableExist)
        return;
    const tableSchema = await getTableSchema(table);
    if (!tableSchema) {
        throw new Error(`[Supastash] Can't create table ${table} because no data was found
        Try creating the table manually using the 'defineLocalSchema()' function.
      `);
    }
    const columns = tableSchema.map((col) => {
        return `${col.column_name} ${mapPgTypeToSQLite(col.data_type)} ${col.column_name === "id" ? "PRIMARY KEY" : ""} ${col.is_nullable === "YES" ? "" : "NOT NULL"}`;
    });
    validatePayload(newPayload);
    try {
        log("Table to be created", columns);
        // Create the table
        await db.runAsync(`CREATE TABLE IF NOT EXISTS ${table} (${columns.join(", ")})`);
    }
    catch (error) {
        throw new Error(`Failed to create table ${table}. 
      Use the 'defineLocalSchema()' function to create the table manually.
      Error: ${error}`);
    }
}
