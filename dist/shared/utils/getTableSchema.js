import { getSupastashDb } from "../db/dbInitializer";
const schemaCache = {};
/**
 * Gets the schema for a table and returns an array of column names
 * @param table - The name of the table
 * @returns an array of column names
 */
export async function getTableSchema(table) {
    if (schemaCache[table])
        return schemaCache[table];
    const db = await getSupastashDb();
    const schema = await db.getAllAsync(`PRAGMA table_info(${table})`);
    if (!schema) {
        throw new Error(`Error fetching schema for ${table}
        Define the schema for this table manually using the 'defineLocalSchema()' call`);
    }
    const columns = schema.map((s) => s.name);
    schemaCache[table] = columns;
    return columns;
}
export function clearSchemaCache(table) {
    if (table) {
        delete schemaCache[table];
    }
    else {
        Object.keys(schemaCache).forEach((key) => delete schemaCache[key]);
    }
}
