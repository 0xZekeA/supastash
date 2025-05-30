import { getSupaStashDb } from "@/db/dbInitializer";
import {
  FilterCalls,
  PayloadData,
  PayloadListResult,
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
export async function updateData(
  table: string,
  payload: PayloadData | null,
  filters: FilterCalls[] | null
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
    synced_at: payload.synced_at ?? null,
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
    const db = await getSupaStashDb();

    await db.runAsync(`UPDATE ${table} SET ${cols} ${clause}`, [
      ...values,
      ...filterValues,
    ]);

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
