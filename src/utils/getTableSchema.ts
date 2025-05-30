import { getSupaStashDb } from "@/db/dbInitializer";

/**
 * Gets the schema for a table and returns an array of column names
 * @param table - The name of the table
 * @returns an array of column names
 */
export async function getTableSchema(table: string): Promise<string[]> {
  const db = await getSupaStashDb();

  const schema: TableSchema[] | null = await db.getAllAsync(
    `PRAGMA table_info(${table})`
  );

  if (!schema) {
    throw new Error(`Error fetching schema for ${table}
        Define the schema for this table manually using the 'defineLocalSchema()' call`);
  }

  const columns = schema.map((s) => s.name);

  return columns;
}
