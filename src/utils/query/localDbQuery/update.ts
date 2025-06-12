import { getSupastashDb } from "../../../db/dbInitializer";
import {
  FilterCalls,
  PayloadData,
  PayloadListResult,
  SyncMode,
} from "../../../types/query.types";
import { getSafeValue } from "../../serializer";
import { assertTableExists } from "../../tableValidator";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";

/**
 * Updates data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to update
 * @param payload - The payload to update
 * @param filters - The filters to apply to the update query
 * @returns a data / error object
 */
export async function updateData<R>(
  table: string,
  payload: R | null,
  filters: FilterCalls[] | null,
  syncMode?: SyncMode
): Promise<PayloadListResult<R>> {
  if (!payload)
    throw new Error(
      `Payload data was not provided for an update call on ${table}`
    );

  if (!table) throw new Error("Table name was not provided for an update call");

  await assertTableExists(table);

  const timeStamp = new Date().toISOString();

  const newPayload: PayloadData = {
    ...payload,
    updated_at: (payload as any).updated_at ?? timeStamp,
    synced_at: Object.prototype.hasOwnProperty.call(payload, "synced_at")
      ? (payload as any).synced_at
      : syncMode && (syncMode === "localOnly" || syncMode === "remoteFirst")
      ? timeStamp
      : null,
  };

  const colArray = Object.keys(newPayload);
  const cols = colArray
    .filter((col) => col !== "id")
    .map((col) => `${col} = ?`)
    .join(", ");
  const values = colArray
    .filter((col) => col !== "id")
    .map((c) => getSafeValue(newPayload[c]));

  const { clause, values: filterValues } = buildWhereClause(filters ?? []);

  try {
    const db = await getSupastashDb();

    await db.runAsync(`UPDATE ${table} SET ${cols} ${clause}`, [
      ...values,
      ...filterValues,
    ]);

    const updatedRow: PayloadData[] | null = await db.getAllAsync(
      `SELECT * FROM ${table} ${clause}`,
      filterValues
    );

    return { error: null, data: updatedRow } as PayloadListResult<R>;
  } catch (error) {
    console.error(`[Supastash] ${error}`);
    return {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      data: null,
    } as PayloadListResult<R>;
  }
}
