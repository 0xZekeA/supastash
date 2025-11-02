import { getSupastashDb } from "../../db/dbInitializer";
import { LocalSchemaDefinition } from "../../types/schemaManager.types";
import { SupastashSQLiteDatabase } from "../../types/supastashConfig.types";
import { clearSchemaCache } from "../../utils/getTableSchema";
import log, { logError } from "../../utils/logs";
import { resetSupastashSyncStatus } from "../../utils/sync/status/services";

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

      const tryDropTable = async (attempt = 1) => {
        try {
          await db.execAsync(dropSql);
          await resetSupastashSyncStatus(tableName, undefined, "all");
        } catch (err) {
          if (String(err).includes("table is locked") && attempt < 5) {
            await new Promise((res) => setTimeout(res, attempt * 100));
            return tryDropTable(attempt + 1);
          }
          throw err;
        }
      };

      await tryDropTable();

      clearSchemaCache(tableName);
      log(`[Supastash] Dropped table ${tableName}`);
    }

    await db.execAsync(sql);

    const standardIndexes = [
      "synced_at",
      "deleted_at",
      "created_at",
      "updated_at",
    ];

    // Generate and create index SQL
    if (__indices?.length) {
      for (const col of __indices) {
        if (standardIndexes.includes(col)) {
          continue;
        }
        const indexName = `idx_${tableName}_${col}`;
        const indexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${col});`;
        await db.execAsync(indexSql);
      }
    }
    await createStandardIndexes(db, tableName, standardIndexes);
  } catch (error) {
    logError(`[Supastash] Error defining schema for table ${tableName}`, error);
  }
}

async function createStandardIndexes(
  db: SupastashSQLiteDatabase,
  table: string,
  columns: string[]
) {
  const pragmaRows = await db.getAllAsync(`PRAGMA table_info(${table});`);
  const existingCols = Array.isArray(pragmaRows)
    ? pragmaRows.map((r: any) => r.name)
    : [];

  try {
    for (const col of columns) {
      if (existingCols.includes(col)) {
        const hasSameIndex = await hasSingleColumnIndex(db, table, col);
        if (!hasSameIndex) {
          await db.execAsync(
            `CREATE INDEX IF NOT EXISTS idx_${table}_${col} ON ${table}(${col});`
          );
        }
      }
    }
  } catch (error) {
    logError(`[Supastash] Error creating standard indexes for ${table}`, error);
  }
}

async function hasSingleColumnIndex(
  db: SupastashSQLiteDatabase,
  table: string,
  col: string
) {
  const idxList = await db.getAllAsync(`PRAGMA index_list(${table});`);
  if (!Array.isArray(idxList)) return false;

  for (const idx of idxList) {
    const idxName = idx.name;
    const info = await db.getAllAsync(`PRAGMA index_info(${idxName});`);
    if (!Array.isArray(info)) continue;
    // Single-column index exactly on `col`
    if (info.length === 1 && info[0]?.name === col) return true;
  }
  return false;
}
