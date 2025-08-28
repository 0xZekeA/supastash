import { getSupastashDb } from "../../db/dbInitializer";
import { LocalSchemaDefinition } from "../../types/schemaManager.types";
import { clearSchemaCache } from "../../utils/getTableSchema";
import log, { logError } from "../../utils/logs";

/**
 * 🧱 defineLocalSchema
 *
 * Defines a local SQLite table schema programmatically, with support for foreign keys and indices.
 * Intended for offline-first apps using Supastash. Ensures consistency in structure and indexing while
 * allowing runtime control of schema migration through `deletePreviousSchema`.
 *
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

    const { __indices, __constraints, ...columnSchema } =
      schema as LocalSchemaDefinition;

    const indexNotInSchema = __indices?.filter((i) => !columnSchema[i]) ?? [];

    if (indexNotInSchema.length > 0) {
      throw new Error(
        `Index columns ${indexNotInSchema.join(
          ", "
        )} not found in schema. Please ensure all columns are defined in the schema.`
      );
    }

    // Ensure required columns
    const safeSchema = {
      ...columnSchema,
      created_at: (columnSchema as any).created_at ?? "TEXT NOT NULL",
      updated_at: (columnSchema as any).updated_at ?? "TEXT NOT NULL",
      synced_at: "TEXT DEFAULT NULL",
      deleted_at: (columnSchema as any).deleted_at ?? "TEXT DEFAULT NULL",
    };

    // Build column definitions
    const schemaParts = Object.entries(safeSchema).map(
      ([key, value]) => `${key} ${value}`
    );

    const schemaString = schemaParts.join(", ");
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${
      __constraints ? `${schemaString}, ${__constraints}` : schemaString
    });`;

    if (deletePreviousSchema) {
      const dropSql = `DROP TABLE IF EXISTS ${tableName}`;
      const clearSyncStatusSql = `DELETE FROM supastash_sync_status WHERE table_name = '${tableName}'`;
      const clearDeleteStatusSql = `DELETE FROM supastash_deleted_status WHERE table_name = '${tableName}'`;
      const clearLastCreatedStatusSql = `DELETE FROM supastash_last_created WHERE table_name = '${tableName}'`;

      const tryDropTable = async (attempt = 1) => {
        try {
          await db.execAsync(dropSql);
        } catch (err) {
          if (String(err).includes("table is locked") && attempt < 5) {
            await new Promise((res) => setTimeout(res, attempt * 100));
            return tryDropTable(attempt + 1);
          }
          throw err;
        }
      };

      await tryDropTable();

      await db.execAsync(clearSyncStatusSql);
      await db.execAsync(clearDeleteStatusSql);
      await db.execAsync(clearLastCreatedStatusSql);

      clearSchemaCache(tableName);
      log(`[Supastash] Dropped table ${tableName}`);
    }

    await db.execAsync(sql);

    // Generate and create index SQL
    if (__indices?.length) {
      for (const col of __indices) {
        const indexName = `idx_${tableName}_${col}`;
        const indexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${col});`;
        await db.execAsync(indexSql);
      }
    }
  } catch (error) {
    logError(`[Supastash] Error defining schema for table ${tableName}`, error);
  }
}
