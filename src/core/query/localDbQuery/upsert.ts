import { getSupaStashDb } from "@/db/dbInitializer";
import {
  FilterCalls,
  PayloadData,
  PayloadListResult,
  SyncMode,
} from "@/types/query.types";
import { buildWhereClause } from "@/utils/query/remoteDb/queryFilterBuilder";
import { getSafeValue } from "@/utils/serializer";
import { assertTableExists } from "@/utils/tableValidator";

/**
 * Updates data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to update
 * @param payload - The payload to update
 * @param filters - The filters to apply to the update query
 * @returns a data / error object
 */
export async function upsertData(
  table: string,
  payload: PayloadData | null,
  filters: FilterCalls[] | null,
  syncMode?: SyncMode
): Promise<PayloadListResult> {
  if (!payload)
    throw new Error(
      `Payload data was not provided for an update call on ${table}`
    );

  if (!table) throw new Error("Table name was not provided for an update call");

  await assertTableExists(table);

  const timeStamp = new Date().toISOString();

  const newPayload: PayloadData = {
    ...payload,
    updated_at: payload.updated_at ?? timeStamp,
    synced_at:
      syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
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

  const { clause, values: filterValues } = buildWhereClause(filters ?? []);

  try {
    const db = await getSupaStashDb();

    const exist = await db.getFirstAsync(
      `SELECT * FROM ${table} ${clause}`,
      filterValues
    );

    if (exist) {
      if (!clause) {
        throw new Error("Update filters are required to avoid mass updates.");
      }
      await db.runAsync(`UPDATE ${table} SET ${cols} ${clause}`, [
        ...updateValues,
        ...filterValues,
      ]);
    } else {
      await db.runAsync(
        `INSERT INTO ${table} (${insertCols}) VALUES (${insertPlaceholders})`,
        insertValues
      );
    }

    const updatedRow: PayloadData[] | null = await db.getAllAsync(
      `SELECT * FROM ${table} ${clause}`,
      filterValues
    );

    return { error: null, data: updatedRow };
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
