import { getSupastashDb } from "../../../db/dbInitializer";
import {
  PayloadData,
  PayloadListResult,
  PayloadResult,
  SyncMode,
} from "../../../types/query.types";
import { getSafeValue } from "../../serializer";
import { assertTableExists } from "../../tableValidator";

/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export async function upsertData<T extends boolean, R>(
  table: string,
  payload: R | R[] | null,
  syncMode?: SyncMode,
  isSingle?: T
): Promise<T extends true ? PayloadResult<R> : PayloadListResult<R>> {
  if (!payload || !table)
    throw new Error("Table and payload are required for upsert.");

  await assertTableExists(table);

  const timeStamp = new Date().toISOString();
  const items = Array.isArray(payload) ? payload : [payload];
  const upserted: PayloadData[] = [];

  try {
    const db = await getSupastashDb();

    for (const item of items) {
      const newPayload: PayloadData = {
        ...item,
        updated_at: (item as any).updated_at ?? timeStamp,
        synced_at: Object.prototype.hasOwnProperty.call(item, "synced_at")
          ? (item as any).synced_at
          : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
          ? timeStamp
          : null,
      };

      const colArray = Object.keys(newPayload);
      const cols = colArray
        .filter((col) => col !== "id")
        .map((col) => `${col} = ?`)
        .join(", ");
      const insertCols = colArray.join(", ");
      const insertPlaceholders = colArray.map(() => "?").join(", ");
      const insertValues = colArray.map((c) => getSafeValue(newPayload[c]));
      const updateValues = colArray
        .filter((col) => col !== "id")
        .map((c) => getSafeValue(newPayload[c]));

      const existing = await db.getFirstAsync(
        `SELECT id FROM ${table} WHERE id = ? LIMIT 1`,
        [(item as any).id]
      );

      if (existing) {
        const updateSql = `UPDATE ${table} SET ${cols} WHERE id = ?`;
        await db.runAsync(updateSql, [...updateValues, (item as any).id]);
      } else {
        const insertSql = `INSERT INTO ${table} (${insertCols}) VALUES (${insertPlaceholders})`;
        await db.runAsync(insertSql, insertValues);
      }

      const updated = await db.getFirstAsync(
        `SELECT * FROM ${table} WHERE id = ?`,
        [(item as any).id]
      );
      if (updated) upserted.push(updated);
    }

    return {
      error: null,
      data: isSingle ? upserted[0] : upserted,
    } as T extends true ? PayloadResult<R> : PayloadListResult<R>;
  } catch (error) {
    console.error(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    } as T extends true ? PayloadResult<R> : PayloadListResult<R>;
  }
}
