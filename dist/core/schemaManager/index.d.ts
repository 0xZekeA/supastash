import { LocalSchemaDefinition } from "../../types/schemaManager.types";
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
export declare function defineLocalSchema(tableName: string, schema: LocalSchemaDefinition, deletePreviousSchema?: boolean): Promise<void>;
//# sourceMappingURL=index.d.ts.map