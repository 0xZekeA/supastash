import { getSupaStashDb } from "@/db/dbInitializer";
import log from "@/utils/logs";
import { getTableSchema } from "../../getTableSchema";
import { pullData } from "./pullData";
import { pullDeletedData } from "./pullDeletedData";
import { stringifyComplexFields } from "./stringifyFields";

/**
 * Updates the local database with the remote changes
 * @param table - The table to update
 */
export async function updateLocalDb(table: string) {
  const db = await getSupaStashDb();

  const deletedData = await pullDeletedData(table);

  const data = await pullData(table);

  const dataToUpdate = data?.filter(
    (d) => !deletedData?.deletedDataMap.has(d.id)
  );

  // Delete records that are no longer in the remote data
  if (deletedData) {
    for (const record of deletedData.records) {
      await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [record.id]);
    }
  }

  // Update local database with remote changes
  if (dataToUpdate) {
    for (const record of dataToUpdate) {
      await upsertData(table, record);
    }
  }
}

/**
 * Upserts a record into the local database
 * @param table - The table to upsert the record into
 * @param record - The record to upsert
 * @param exists - Whether the record already exists in the database
 */
export async function upsertData(table: string, record: any) {
  if (!record.id) return;
  const db = await getSupaStashDb();

  // Check if this record exists locally and if local version is newer
  const localRecord: { updated_at: string } | null = await db.getFirstAsync(
    `SELECT updated_at FROM ${table} WHERE id = ?`,
    [record.id]
  );

  // If local record exists and is more recent, skip this update
  if (
    localRecord &&
    new Date(localRecord.updated_at) >= new Date(record.updated_at)
  ) {
    log(`Skipping ${table}:${record.id} - local is newer`);
    return;
  }

  const columns = await getTableSchema(table);

  const recordToSave = {
    ...stringifyComplexFields(record),
    synced_at: new Date().toISOString(),
  };

  // Prep for upsert
  const keys = columns;
  const placeholders = keys.map(() => "?").join(", ");
  const updateParts = keys
    .filter((key) => key !== "id")
    .map((key) => `${key} = ?`);
  const updatePlaceholders = updateParts.join(", ");
  const values = keys.map((key) => recordToSave[key]);
  const updateValues = keys
    .filter((key) => key !== "id")
    .map((key) => recordToSave[key]);

  if (!!localRecord) {
    // Update existing record
    await db.runAsync(
      `UPDATE ${table} SET ${updatePlaceholders} WHERE id = ?`,
      [...updateValues, record.id]
    );
  } else {
    // Insert new record
    await db.runAsync(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
      values
    );
  }
}
