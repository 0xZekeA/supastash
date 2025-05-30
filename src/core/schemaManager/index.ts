import { getSupaStashDb } from "@/db/dbInitializer";

/**
 * Defines the schema for a local table manually
 *
 * @param tableName - The name of the table
 * @param schema - The schema for the table
 * @param deletePreviousSchema - Whether to delete the previous schema
 */
export async function defineLocalSchema(
  tableName: string,
  schema: Record<string, string>,
  deletePreviousSchema = false
) {
  if (!schema.id) {
    throw new Error(
      `[Supastash] 'id' of type UUID column is required for table ${tableName}`
    );
  }

  try {
    const db = await getSupaStashDb();

    // Include the columns that must be in the schema
    const safeSchema = {
      ...schema,
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      synced_at: "TEXT DEFAULT NULL",
      deleted_at: "TEXT DEFAULT NULL",
    };

    const schemaString = Object.entries(safeSchema)
      .map(([key, value]) => `${key} ${value}`)
      .join(", ");

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schemaString});`;

    if (deletePreviousSchema) {
      const dropSql = `DROP TABLE IF EXISTS ${tableName}`;
      const clearSyncStatusSql = `DELETE FROM supastash_sync_status WHERE table_name = '${tableName}'`;

      await db.execAsync(dropSql);
      await db.execAsync(clearSyncStatusSql);
      console.log(`Dropped table ${tableName}`);
    }

    await db.execAsync(sql);
  } catch (error) {
    console.error(error);
  }
}
