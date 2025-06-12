import { getSupastashDb } from "../db/dbInitializer";
import { TableSchema } from "../types/syncEngine.types";

const schemaCache: Record<string, string[]> = {};

/**
 * Gets the schema for a table and returns an array of column names
 * @param table - The name of the table
 * @returns an array of column names
 */
export async function getTableSchema(table: string): Promise<string[]> {
  if (schemaCache[table]) return schemaCache[table];
  const db = await getSupastashDb();

  const schema: TableSchema[] | null = await db.getAllAsync(
    `PRAGMA table_info(${table})`
  );

  if (!schema) {
    throw new Error(`Error fetching schema for ${table}
        Define the schema for this table manually using the 'defineLocalSchema()' call`);
  }

  const columns = schema.map((s) => s.name);

  schemaCache[table] = columns;

  return columns;
}

export function clearSchemaCache(table?: string) {
  if (table) {
    delete schemaCache[table];
  } else {
    Object.keys(schemaCache).forEach((key) => delete schemaCache[key]);
  }
}
