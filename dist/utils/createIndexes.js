import { getSupastashDb } from "../db/dbInitializer";
import { logError } from "./logs";
import { getAllTables } from "./sync/getAllTables";
/**
 * Create a single-column index on "id" where it actually helps.
 * - Skips virtual tables (e.g. FTS), views, system tables.
 * - Skips when "id" doesn't exist.
 * - Skips when "id" is already PK (including TEXT PK which has an implicit unique index).
 * - Skips when there's already an index on "id".
 */
export async function createIdIndexes() {
    const db = await getSupastashDb();
    const tables = await getAllTables();
    if (!tables || !tables.length)
        return;
    const q = (s) => `"${s.replace(/"/g, '""')}"`;
    for (const table of tables) {
        if (!table)
            continue;
        try {
            // 1) Check sqlite_schema for table kind + DDL
            const schemaRow = await db.getFirstAsync(`SELECT type, sql FROM sqlite_schema WHERE name = ?1`, [table]);
            if (!schemaRow)
                continue; // not a real table in this db
            if (schemaRow.type !== "table")
                continue; // views, triggers, etc.
            const ddl = schemaRow.sql || "";
            // Virtual tables get skipped
            if (/\bCREATE\s+VIRTUAL\s+TABLE\b/i.test(ddl)) {
                continue;
            }
            // 2) Inspect columns; ensure "id" exists and get PK info
            const columns = await db.getAllAsync(`PRAGMA table_info(${q(table)})`);
            if (!columns?.length)
                continue;
            const idCol = columns.find((c) => c.name === "id");
            if (!idCol)
                continue; // no "id" column → nothing to do
            // If "id" is part of the PK, indexing is unnecessary/redundant:
            // - INTEGER PRIMARY KEY uses rowid (fast already).
            // - TEXT/other PRIMARY KEYs get an implicit unique index.
            const pkCols = columns.filter((c) => c.pk > 0);
            const idIsPk = idCol.pk > 0;
            if (idIsPk) {
                // If it's the only PK column or part of composite PK, skip — already indexed enough.
                continue;
            }
            // 3) Check if an index on "id" already exists
            const indexes = await db.getAllAsync(`PRAGMA index_list(${q(table)})`);
            let hasIdOnlyIndex = false;
            if (indexes?.length) {
                for (const ix of indexes) {
                    // Ignore partial indexes for simplicity
                    const cols = await db.getAllAsync(`PRAGMA index_info(${q(ix.name)})`);
                    if (!cols?.length)
                        continue;
                    if (cols.length === 1 && cols[0].name === "id") {
                        hasIdOnlyIndex = true;
                        break;
                    }
                }
            }
            if (hasIdOnlyIndex)
                continue;
            // 4) Create the index safely
            const idxName = `idx_${table}_id`;
            try {
                await db.runAsync("BEGIN");
                await db.runAsync(`CREATE INDEX IF NOT EXISTS ${q(idxName)} ON ${q(table)}("id");`);
                await db.runAsync("COMMIT");
            }
            catch (e) {
                await db.runAsync("ROLLBACK");
                logError(`[index-skip] ${table}: ${e.message}`);
            }
        }
        catch (err) {
            logError(`[index-check-failed] ${table}: ${err.message}`);
        }
    }
}
