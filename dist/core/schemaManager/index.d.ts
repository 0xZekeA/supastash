import { LocalSchemaDefinition } from "../../types/schemaManager.types";
/**
 * 🧱 defineLocalSchema
 *
 * Defines a local SQLite table schema programmatically, with support for foreign keys and indices.
 * Intended for offline-first apps using Supastash. Ensures consistency in structure and indexing while
 * allowing runtime control of schema migration through `deletePreviousSchema`.
 *
 * It will also create the following indexes:
 * - synced_at
 * - deleted_at
 * - created_at
 * - updated_at
 * if they do not exist in the schema and if columns exist in the table.
 * ---
 *
 * @param tableName - The name of the local SQLite table.
 * @param schema - The column definitions (e.g. `{ id: "TEXT NOT NULL", name: "TEXT" }`) and optional metadata:
 *   - `__indices`: Column names to be indexed.
 * @param deletePreviousSchema - If `true`, drops the existing table and related Supastash metadata before re-creating.
 *   ⚠️ WARNING: If left `true` in production, the table will be dropped and re-created **on every load**.
 *
 * ---
 *
 * @example
 * defineLocalSchema("users", {
 *   id: "TEXT PRIMARY KEY",
 *   name: "TEXT NOT NULL",
 *   email: "TEXT",
 *   user_id: "TEXT NOT NULL",
 *   __indices: ["email"]
 * }, true);
 *
 * @remarks
 * - Automatically injects `created_at`, `updated_at`, `deleted_at`, and `synced_at` columns.
 * - Requires an `id` column to exist.
 * - Validates all foreign keys and index columns exist in the schema before applying.
 */
export declare function defineLocalSchema(tableName: string, schema: LocalSchemaDefinition, deletePreviousSchema?: boolean): Promise<void>;
//# sourceMappingURL=index.d.ts.map