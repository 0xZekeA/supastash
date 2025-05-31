import { getSupaStashDb } from "../../../db/dbInitializer";
import {
  PayloadData,
  PayloadResult,
  SyncMode,
} from "../../../types/query.types";
import { getSafeValue } from "../../../utils/serializer";
import { assertTableExists } from "../../../utils/tableValidator";

/**
 * Inserts data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns a data / error object
 */
export async function insertData(
  table: string,
  payload: PayloadData | null,
  syncMode?: SyncMode
): Promise<PayloadResult> {
  if (!table) throw new Error("Table name was not provided for an insert call");

  if (!payload)
    throw new Error(
      `Payload data was not provided for an insert call on ${table}`
    );

  if (!payload.id) {
    throw new Error(`Payload must include a valid 'id' field for inserts.`);
  }

  await assertTableExists(table);

  const timeStamp = new Date().toISOString();

  let newPayload = { ...payload };

  // Add timestamps
  newPayload.created_at ??= timeStamp;
  newPayload.updated_at ??= timeStamp;
  newPayload.synced_at ??=
    syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
      ? timeStamp
      : null;

  const colArray = Object.keys(newPayload);
  const cols = colArray.join(", ");

  const placeholders = colArray.map(() => "?").join(", ");
  const values = colArray.map((c) => getSafeValue(newPayload[c]));

  try {
    const db = await getSupaStashDb();

    // Check if record already exist
    const exist = await db.getFirstAsync(
      `SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`,
      [newPayload.id]
    );

    if (exist)
      throw new Error(
        `Record with id ${newPayload.id} already exists in table ${table}`
      );

    // Insert data
    await db.runAsync(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
      values
    );

    const insertedRow: PayloadData | null = await db.getFirstAsync(
      `SELECT * FROM ${table} WHERE id = ?`,
      [newPayload.id]
    );

    return { error: null, data: insertedRow };
  } catch (error) {
    console.error(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    };
  }
}
