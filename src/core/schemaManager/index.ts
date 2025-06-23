import { getSupastashDb } from "../../db/dbInitializer";
import { LocalSchemaDefinition } from "../../types/schemaManager.types";
import { clearSchemaCache } from "../../utils/getTableSchema";
import log from "../../utils/logs";

/**
 * Defines the schema for a local table manually
 *
 * @example
 * defineLocalSchema("users", {
 *   id: "TEXT NOT NULL",
 *   name: "TEXT NOT NULL",
 *   email: "TEXT NOT NULL",
 * }, true // deletes previous schema if true. Must be true if schema already exists
 * // ⚠️ Living option as true will continually delete table on load.
 * );
 *
 * @param tableName - The name of the table
 * @param schema - The schema for the table
 * @param deletePreviousSchema - Whether to delete the previous schema. Default(false)
 */
export async function defineLocalSchema(
  tableName: string,
  schema: LocalSchemaDefinition,
  deletePreviousSchema = false
) {
  try {
    if (!schema.id) {
      throw new Error(
        `'id' of type UUID column is required for table ${tableName}`
      );
    }
    const db = await getSupastashDb();

    // Include the columns that must be in the schema
    const safeSchema = {
      ...schema,
      created_at: schema.created_at ?? "TEXT NOT NULL",
      updated_at: schema.updated_at ?? "TEXT NOT NULL",
      synced_at: "TEXT DEFAULT NULL",
      deleted_at: schema.deleted_at ?? "TEXT DEFAULT NULL",
    };

    const schemaString = Object.entries(safeSchema)
      .map(([key, value]) => `${key} ${value}`)
      .join(", ");

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schemaString});`;

    if (deletePreviousSchema) {
      const dropSql = `DROP TABLE IF EXISTS ${tableName}`;
      const clearSyncStatusSql = `DELETE FROM supastash_sync_status WHERE table_name = '${tableName}'`;
      const clearDeleteStatusSql = `DELETE FROM supastash_deleted_status WHERE table_name = '${tableName}'`;

      await db.execAsync(dropSql);
      await db.execAsync(clearSyncStatusSql);
      await db.execAsync(clearDeleteStatusSql);
      clearSchemaCache(tableName);
      log(`[Supastash] Dropped table ${tableName}`);
    }

    await db.execAsync(sql);
  } catch (error) {
    console.error(
      `[Supastash] Error defining schema for table ${tableName}`,
      error
    );
  }
}
