import { getSupastashDb } from "../../../../db/dbInitializer";
import { SyncMode } from "../../../../types/query.types";
import { getSafeValue } from "../../../serializer";
import { parseStringifiedFields as parseRow } from "../../../sync/pushLocal/parseFields";

interface InsertOptions<R = any> {
  table: string;
  syncMode?: SyncMode;
  nowISO?: string;
  returnInsertedRows?: boolean;
}

const MAX_PARAMS = 999;
const CHECK_BATCH = 900;
const YIELD_EVERY = 500;

export async function insertMany<R = any>(
  payload: R[],
  opts: InsertOptions<R>
): Promise<R[] | void> {
  const db = await getSupastashDb();
  const { table, syncMode, returnInsertedRows } = opts;
  const timeStamp = opts.nowISO ?? new Date().toISOString();

  assertTableName(table);
  if (!Array.isArray(payload) || payload.length === 0) return [];

  const idSet = new Set<string>();
  // 1) Validate & gather ids
  const ids = payload.map((item: any, i: number) => {
    if (!item || !item.id) {
      throw new Error(
        `Payload[${i}] must include a valid 'id' field for inserts.`
      );
    }
    const id = String(item.id);
    if (idSet.has(id)) {
      throw new Error(`Duplicate id: ${id} in payload[${i}]`);
    }
    idSet.add(id);
    return id;
  });

  // 2) Check existing ids in DB (batched; fail-fast)
  for (let i = 0; i < ids.length; i += CHECK_BATCH) {
    const part = ids.slice(i, i + CHECK_BATCH);
    const ph = makePlaceholders(part.length);
    const existing = await db.getAllAsync(
      `SELECT id FROM ${quoteIdent(table)} WHERE id IN (${ph})`,
      part
    );
    if (existing.length) {
      const taken = existing.map((r: any) => String(r.id));
      throw new Error(
        `Record(s) already exist in table ${table}: ${taken.join(", ")}`
      );
    }
  }

  // 3) Do inserts in a single transaction
  const insertedIds: string[] = [];

  const run = async () => {
    for (let i = 0; i < payload.length; i++) {
      const item: any = payload[i];
      const newPayload = {
        ...item,
        created_at: hasOwn(item, "created_at") ? item.created_at : timeStamp,
        updated_at: hasOwn(item, "updated_at") ? item.updated_at : timeStamp,
        synced_at: hasOwn(item, "synced_at")
          ? item.synced_at
          : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
          ? timeStamp
          : null,
      };

      const colArray = Object.keys(newPayload);
      if (colArray.length === 0) continue;

      // Validate/quote column names
      const colsSql = colArray.map(quoteIdent).join(", ");
      const placeholders = makePlaceholders(colArray.length);
      const values = colArray.map((c) =>
        normalizeValue(getSafeValue(newPayload[c as keyof typeof newPayload]))
      );

      await db.runAsync(
        `INSERT INTO ${quoteIdent(
          table
        )} (${colsSql}) VALUES (${placeholders})`,
        values
      );

      insertedIds.push(String(item.id));

      if ((i + 1) % YIELD_EVERY === 0) await microYield();
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

  // 4) Optionally fetch inserted rows (batched) and return in input order
  if (!returnInsertedRows) return;
  if (insertedIds.length === 0) return [];

  const rows: any[] = [];
  for (let i = 0; i < insertedIds.length; i += CHECK_BATCH) {
    const part = insertedIds.slice(i, i + CHECK_BATCH);
    const ph = makePlaceholders(part.length);
    const chunkRows = await db.getAllAsync(
      `SELECT * FROM ${quoteIdent(table)} WHERE id IN (${ph})`,
      part
    );
    rows.push(...chunkRows);
  }

  const map = new Map(
    rows.map((r: any) => [String(r.id), parseRow ? parseRow(r) : r])
  );
  return insertedIds.map((id) => map.get(id)).filter(Boolean) as R[];
}

/* ---------- helpers ---------- */

function makePlaceholders(n: number): string {
  if (n <= 0) throw new Error("No placeholders to make");
  if (n > MAX_PARAMS)
    throw new Error(`Requested ${n} placeholders; max is ${MAX_PARAMS}`);
  return Array(n).fill("?").join(",");
}

function hasOwn(obj: any, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function assertTableName(name: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe table name: ${name}`);
  }
}

function quoteIdent(name: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe identifier: ${name}`);
  }
  return `"${name}"`;
}

function normalizeValue(v: any) {
  return v === undefined ? null : v;
}

function defaultSafe(value: any): any {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function microYield() {
  return new Promise((res) => setTimeout(res, 0));
}
