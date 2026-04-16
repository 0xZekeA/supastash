import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { tableSchemaData } from "../../../store/tableSchemaData";
import { isNetworkError, isOnline } from "../../connection";
import log, { logWarn } from "../../logs";
const SERVER_SIDE_DOCS_URL = `https://0xzekea.github.io/supastash/docs/getting-started/#%EF%B8%8F-server-side-setup-for-filtered-pulls`;
async function ensureRemoteSchemaTableExists() {
    const db = await getSupastashDb();
    await db.execAsync(`CREATE TABLE IF NOT EXISTS supastash_remote_table_schema (
    table_name TEXT PRIMARY KEY,
    schema_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);
}
function validatePayloadForTable(payload, tableName) {
    const columnsMap = new Map();
    payload.forEach((col) => {
        columnsMap.set(col.column_name, col);
    });
    const id = columnsMap.get("id");
    if (!id ||
        !["uuid", "text"].includes(id.data_type) ||
        id.is_nullable === "YES") {
        throw new Error(`Column 'id' must be uuid/text and NOT NULL for table ${tableName}`);
    }
    const timestampType = ["timestamp with time zone", "timestamptz"];
    const updatedAt = columnsMap.get("updated_at");
    if (!updatedAt) {
        throw new Error(`'updated_at' must be present on table ${tableName}
      See docs ${SERVER_SIDE_DOCS_URL}
      `);
    }
    if (!timestampType.includes(updatedAt.data_type)) {
        logWarn(`'updated_at' must be of type "timestamptz" on table ${tableName}. Current type: ${updatedAt.data_type}. This can cause inconsistencies in the sync logic.`);
    }
    const createdAt = columnsMap.get("created_at");
    if (!createdAt) {
        throw new Error(`'created_at' must be present on table ${tableName}
      See docs ${SERVER_SIDE_DOCS_URL}
      `);
    }
    if (!timestampType.includes(createdAt.data_type)) {
        logWarn(`'created_at' must be of type "timestamptz" on table ${tableName}. Current type: ${createdAt.data_type}. This can cause inconsistencies in the sync logic.`);
    }
    const deletedAt = columnsMap.get("deleted_at");
    if (!deletedAt) {
        throw new Error(`'deleted_at' must be present on table ${tableName}
      See docs ${SERVER_SIDE_DOCS_URL}
      `);
    }
    if (!timestampType.includes(deletedAt.data_type)) {
        logWarn(`'deleted_at' must be of type "timestamptz" on table ${tableName}. Current type: ${deletedAt.data_type}. This can cause inconsistencies in the sync logic.`);
    }
    const cfg = getSupastashConfig();
    if (cfg.replicationMode === "server-side") {
        const arrivedAt = columnsMap.get("arrived_at");
        if (!arrivedAt) {
            throw new Error(`'arrived_at' must be present on table ${tableName}
        See docs ${SERVER_SIDE_DOCS_URL}
        `);
        }
        if (!timestampType.includes(arrivedAt.data_type)) {
            logWarn(`'arrived_at' must be of type "timestamptz" on table ${tableName}. Current type: ${arrivedAt.data_type}. This can cause inconsistencies in the sync logic.`);
        }
    }
}
async function upsertRemoteSchema(table, schema) {
    const payload = JSON.stringify(schema);
    const db = await getSupastashDb();
    await db.runAsync(`
      INSERT INTO supastash_remote_table_schema (table_name, schema_json, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(table_name)
      DO UPDATE SET
        schema_json = excluded.schema_json,
        updated_at = excluded.updated_at;
      `, [table, payload]);
}
async function getLocalSchema(table) {
    const db = await getSupastashDb();
    const row = await db.getFirstAsync(`
      SELECT schema_json
      FROM supastash_remote_table_schema
      WHERE table_name = ?
      `, [table]);
    if (!row)
        return null;
    return JSON.parse(row.schema_json);
}
export function appendSyncedAt(schema) {
    return [
        ...schema,
        {
            column_name: "synced_at",
            data_type: "text",
            is_nullable: "YES",
        },
    ];
}
const localSchemaCache = new Map();
export async function getRemoteTableSchema(table) {
    const config = getSupastashConfig();
    const supabase = config?.supabaseClient;
    if (!supabase) {
        throw new Error(`Supabase client not found`);
    }
    // 1. Memory cache
    if (tableSchemaData.has(table)) {
        return appendSyncedAt(tableSchemaData.get(table));
    }
    await ensureRemoteSchemaTableExists();
    const online = await isOnline();
    // 2. If offline → SQLite fallback
    if (!online) {
        if (localSchemaCache.has(table)) {
            return appendSyncedAt(localSchemaCache.get(table));
        }
        const local = await getLocalSchema(table);
        if (!local)
            return null;
        localSchemaCache.set(table, local);
        return appendSyncedAt(local);
    }
    // 3. Remote fetch
    const { data, error } = await supabase.rpc("get_table_schema", {
        table_name: table,
    });
    if (error || !Array.isArray(data)) {
        if (error && !isNetworkError(error)) {
            log(`[Supastash] Error getting remote keys for table ${table} on public schema: ${error.message}
      You can find more information in the Supastash docs: ${SERVER_SIDE_DOCS_URL}`);
        }
        return null;
    }
    validatePayloadForTable(data, table);
    // 4. Persist
    await upsertRemoteSchema(table, data);
    tableSchemaData.set(table, data);
    return appendSyncedAt(data);
}
