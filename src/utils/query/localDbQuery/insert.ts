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
 * Inserts data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns a data / error object
 */
export async function insertData<T extends boolean, R>(
  table: string,
  payload: R[] | null,
  syncMode?: SyncMode,
  isSingle?: T
): Promise<T extends true ? PayloadResult<R> : PayloadListResult<R>> {
  if (!table) throw new Error("Table name was not provided for an insert call");

  if (!payload)
    throw new Error(
      `Payload data was not provided for an insert call on ${table}`
    );

  const timeStamp = new Date().toISOString();
  const inserted: R[] = [];

  try {
    await assertTableExists(table);

    const db = await getSupastashDb();

    for (const item of payload) {
      if (!(item as any).id) {
        throw new Error(`Payload must include a valid 'id' field for inserts.`);
      }

      const newPayload: PayloadData = {
        ...item,
        created_at: (item as any).created_at ?? timeStamp,
        updated_at: (item as any).updated_at ?? timeStamp,
        synced_at: Object.prototype.hasOwnProperty.call(item, "synced_at")
          ? (item as any).synced_at
          : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
          ? timeStamp
          : null,
      };

      const colArray = Object.keys(newPayload);
      const cols = colArray.join(", ");

      const placeholders = colArray.map(() => "?").join(", ");
      const values = colArray.map((c) => getSafeValue(newPayload[c]));

      // Check if record already exist
      const exists = await db.getFirstAsync(
        `SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`,
        [newPayload.id]
      );

      if (exists)
        throw new Error(
          `Record with id ${newPayload.id} already exists in table ${table}`
        );

      // Insert data
      await db.runAsync(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
        values
      );

      const insertedRow: R | null = await db.getFirstAsync(
        `SELECT * FROM ${table} WHERE id = ?`,
        [newPayload.id]
      );
      if (insertedRow) {
        inserted.push(insertedRow);
      }
    }

    return {
      error: null,
      data: isSingle ? inserted[0] : inserted,
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
