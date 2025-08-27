import { getSupastashDb } from "../../../../db/dbInitializer";
import { SyncMode } from "../../../../types/query.types";
import { generateUUIDv4 } from "../../../genUUID";
import { parseStringifiedFields as parseRow } from "../../../sync/pushLocal/parseFields";

const DEFAULT_DATE = "1970-01-01T00:00:00.000Z";

interface UpsertOptions<R = any> {
  table: string;
  onConflictKeys?: string[]; // default ["id"]
  syncMode?: SyncMode;
  nowISO?: string;
  preserveTimestamp?: boolean; // if false, we set updated_at when missing
  returnRows?: boolean; // default true
  yieldEvery?: number; // default 500
}

const CHECK_BATCH = 900; // param headroom under 999

export async function upsertMany<R = any>(
  items: R[],
  opts: UpsertOptions<R>
): Promise<R[] | void> {
  const db = await getSupastashDb();
  const {
    table,
    syncMode,
    nowISO,
    preserveTimestamp = false,
    yieldEvery = 500,
  } = opts;
  const returnRows = opts.returnRows !== false;
  const onConflictKeys =
    opts.onConflictKeys && opts.onConflictKeys.length
      ? opts.onConflictKeys
      : ["id"];

  assertTableName(table);
  onConflictKeys.forEach(assertIdent);

  if (!Array.isArray(items) || items.length === 0) return [];

  const timeStamp = nowISO ?? new Date().toISOString();

  let existingIdSet: Set<string> | null = null;
  if (onConflictKeys.length === 1 && onConflictKeys[0] === "id") {
    const ids = items
      .map((row: any, i: number) => {
        const id = row?.id ?? null;
        // allow missing; we’ll generate before insert
        return id == null ? null : String(id);
      })
      .filter(Boolean) as string[];

    existingIdSet = new Set(await selectIdsInBatches(db, table, ids));
  }

  const upserted: R[] = [];

  const run = async () => {
    for (let i = 0; i < items.length; i++) {
      const input: any = items[i] ?? {};
      const row: any = { ...input };

      // Ensure id if it's part of conflict keys
      if (onConflictKeys.includes("id") && (row.id == null || row.id === "")) {
        row.id = generateUUIDv4();
      }

      // synced_at default
      if (!hasOwn(row, "synced_at")) {
        row.synced_at =
          syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
            ? timeStamp
            : null;
      }

      // Decide: update or insert?
      const { clause, values: keyValues } = buildWhere(onConflictKeys, row);
      const canCheckConflict = clause !== null;

      let exists = false;

      if (
        onConflictKeys.length === 1 &&
        onConflictKeys[0] === "id" &&
        existingIdSet
      ) {
        exists = existingIdSet.has(String(row.id));
      } else if (canCheckConflict) {
        const existing = await db.getAllAsync(
          `SELECT 1 FROM ${quote(table)} WHERE ${clause} LIMIT 2`,
          keyValues
        );
        if (existing.length > 1) {
          throw new Error(
            `Multiple rows matched onConflictKeys in '${table}' — expected uniqueness on ${onConflictKeys.join(
              ", "
            )}`
          );
        }
        exists = existing.length === 1;
      }

      if (exists) {
        // UPDATE path
        if (!preserveTimestamp || input.updated_at === undefined) {
          row.updated_at =
            input.updated_at !== undefined ? input.updated_at : timeStamp;
        }
        // Build SET list (exclude conflict keys; also skip undefined to avoid nulling unintentionally)
        const updateCols = Object.keys(row).filter(
          (c) => !onConflictKeys.includes(c) && row[c] !== undefined
        );
        if (updateCols.length > 0) {
          const setSql = updateCols.map((c) => `${quote(c)} = ?`).join(", ");
          const setVals = updateCols.map((c) => toDbValue(row[c]));
          if (!canCheckConflict) {
            throw new Error(
              `Missing onConflictKeys in payload; cannot UPDATE in '${table}'. Keys: ${onConflictKeys.join(
                ", "
              )}`
            );
          }
          await db.runAsync(
            `UPDATE ${quote(table)} SET ${setSql} WHERE ${clause}`,
            [...setVals, ...keyValues]
          );

          if (returnRows) {
            const updated = await db.getFirstAsync(
              `SELECT * FROM ${quote(table)} WHERE ${clause} LIMIT 1`,
              keyValues
            );

            if (returnRows) upserted.push(parseRow(updated));
          }
        }
      } else {
        // INSERT path
        if (!hasOwn(row, "created_at")) row.created_at = timeStamp;
        if (!hasOwn(row, "updated_at")) row.updated_at = timeStamp;
        if (!hasOwn(row, "id")) row.id = generateUUIDv4();

        const insertCols = Object.keys(row).filter((c) => row[c] !== undefined);
        const placeholders = insertCols.map(() => "?").join(", ");
        const insertVals = insertCols.map((c) => toDbValue(row[c]));

        await db.runAsync(
          `INSERT INTO ${quote(table)} (${insertCols
            .map(quote)
            .join(", ")}) VALUES (${placeholders})`,
          insertVals
        );

        if (returnRows) {
          const inserted = await db.getFirstAsync(
            `SELECT * FROM ${quote(table)} WHERE ${clause} LIMIT 1`,
            keyValues
          );

          upserted.push(parseRow(inserted));
        }

        if (
          existingIdSet &&
          onConflictKeys.length === 1 &&
          onConflictKeys[0] === "id"
        ) {
          existingIdSet.add(String(row.id));
        }
      }

      if (yieldEvery > 0 && (i + 1) % yieldEvery === 0) {
        await microYield();
      }
    }
  };

  await db.runAsync("BEGIN");
  try {
    await run();
    await db.runAsync("COMMIT");
  } catch (e) {
    await db.runAsync("ROLLBACK");
    throw e;
  }

  return returnRows ? upserted : undefined;
}

/* ================= helpers ================= */

function buildWhere(
  keys: string[],
  row: Record<string, any>
): { clause: string | null; values: any[] } {
  if (!keys.length) return { clause: null, values: [] };
  const missing = keys.filter((k) => row[k] === undefined || row[k] === null);
  if (missing.length) return { clause: null, values: [] };
  const parts = keys.map((k) => `${quote(k)} = ?`);
  const vals = keys.map((k) => toDbValue(row[k]));
  return { clause: parts.join(" AND "), values: vals };
}

function toDbValue(v: any) {
  if (v === undefined) return null;
  if (v === null) return null;
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

function hasOwn(obj: any, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function assertTableName(name: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe table name: ${name}`);
  }
}

function assertIdent(name: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe identifier: ${name}`);
  }
}

function quote(name: string) {
  return `"${name}"`;
}

async function selectIdsInBatches(db: any, table: string, ids: string[]) {
  const out: string[] = [];
  for (let i = 0; i < ids.length; i += CHECK_BATCH) {
    const part = ids.slice(i, i + CHECK_BATCH);
    if (part.length === 0) continue;
    const ph = Array(part.length).fill("?").join(",");
    const rows = await db.getAllAsync(
      `SELECT id FROM ${quote(table)} WHERE id IN (${ph})`,
      part
    );
    for (const r of rows) out.push(String(r.id));
  }
  return out;
}

function microYield() {
  return new Promise((res) => setTimeout(res, 0));
}
