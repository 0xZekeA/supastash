import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import {
  DEFAULT_RECEIVED_DATA_COMPLETED,
  RECEIVED_DATA_COMPLETED_MAP,
} from "../../../store/syncStatus";
import { SupastashFilter } from "../../../types/realtimeData.types";
import { UpsertDataParams } from "../../../types/syncEngine.types";
import { isOnline } from "../../connection";
import { generateUUIDv4 } from "../../genUUID";
import { getTableSchema } from "../../getTableSchema";
import log, { logError, logWarn } from "../../logs";
import { refreshScreen } from "../../refreshScreenCalls";
import { SyncInfoUpdater } from "../queryStatus";
import { setSupastashSyncStatus } from "../status/services";
import { updateLocalSyncedAt } from "../status/syncUpdate";
import { deleteReceivedDataCompleted } from "./helpers";
import { pullData } from "./pullData";
import { stringifyValue } from "./stringifyFields";

let isInSync = new Map<string, boolean>();
const DEFAULT_DATE = "1970-01-01T00:00:00Z";
const BATCH_SIZE = 500;
const DELETE_CHUNK = 999;

/**
 * Updates the local database with the remote changes
 * @param table - The table to update
 */
export async function updateLocalDb(
  table: string,
  filters?: SupastashFilter[],
  onReceiveData?: (payload: any) => Promise<void>
) {
  if (isInSync.get(table)) return;
  const cfg = getSupastashConfig();
  if (cfg.supastashMode === "ghost") return;
  if (!(await isOnline())) return;
  isInSync.set(table, true);
  const batchId = generateUUIDv4();
  try {
    const db = await getSupastashDb();

    // Initialize the batch completed map
    RECEIVED_DATA_COMPLETED_MAP[batchId] = {
      arrived_at: DEFAULT_RECEIVED_DATA_COMPLETED,
      updated_at: DEFAULT_RECEIVED_DATA_COMPLETED,
    };
    let refreshNeeded = false;

    while (true) {
      const dataResult = await pullData({ table, filters, batchId });
      if (!dataResult) break;
      const data = dataResult?.data;
      const timestamps = dataResult.timestamps;
      const deletedIds = dataResult.deletedIds;
      const deletedIdSet = new Set(deletedIds ?? []);

      SyncInfoUpdater.setUnsyncedDataCount({
        amount: data?.length ?? 0,
        type: "pull",
        table,
      });
      SyncInfoUpdater.setUnsyncedDeletedCount({
        amount: deletedIds?.length ?? 0,
        type: "pull",
        table,
      });

      refreshNeeded = !!data?.length || !!deletedIds?.length;

      // Delete records that are no longer in the remote data
      await db.withTransaction(async (tx) => {
        if (deletedIds && deletedIds.length > 0) {
          const ids = deletedIds;
          for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
            const slice = ids.slice(i, i + DELETE_CHUNK);
            const placeholders = slice.map(() => "?").join(", ");
            await tx.runAsync(
              `DELETE FROM ${table} WHERE id IN (${placeholders})`,
              slice
            );
          }
        }

        // Get the local stamp of the records
        let localStamp = new Map<string, string | null>();
        if (data?.length) {
          const ids = data.map((r: any) => r.id).filter(Boolean);
          for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
            const slice = ids.slice(i, i + DELETE_CHUNK);
            const placeholders = slice.map(() => "?").join(", ");
            const rows = await db.getAllAsync(
              `SELECT id, updated_at FROM ${table} WHERE id IN (${placeholders})`,
              slice
            );
            for (const row of rows ?? []) {
              localStamp.set(row.id, row.updated_at ?? null);
            }
          }
        }

        // Update local database with remote changes
        if (data?.length) {
          for (let i = 0; i < data.length; i++) {
            const record = data[i];
            if (!record?.id) continue;
            if (deletedIdSet.has(record.id)) continue;

            const localUpdated = localStamp.get(record.id) ?? DEFAULT_DATE;
            const remoteUpdated = record.updated_at ?? DEFAULT_DATE;
            if (new Date(localUpdated) >= new Date(remoteUpdated)) {
              // local is newer or same — skip
              continue;
            }

            if (onReceiveData) {
              await onReceiveData(record);
            } else {
              await upsertData({
                tx,
                table,
                record,
                doesExist: localStamp.has(record.id),
              });
            }

            if ((i + 1) % BATCH_SIZE === 0) {
              await new Promise((res) => setTimeout(res, 0));
            }
          }
        }
      });

      if (timestamps) {
        await setSupastashSyncStatus(table, filters, {
          lastSyncedAt: timestamps.updatedMax,
          lastDeletedAt: timestamps.deletedMax,
          lastSyncedAtPk: timestamps.updatedMaxPk,
          filterNamespace: "global",
        });
      }

      const completedSet = RECEIVED_DATA_COMPLETED_MAP[batchId];
      if (Object.values(completedSet ?? {}).every(Boolean)) {
        break;
      }
    }

    if (refreshNeeded) refreshScreen(table);
  } catch (error) {
    logWarn(`[Supastash] Error updating local db for ${table}`, error);
    throw error;
  } finally {
    isInSync.delete(table);
    deleteReceivedDataCompleted(batchId);
  }
}

const warned = new Map<string, boolean>();

/**
 * Upserts a record into the local database
 * @param table - The table to upsert the record into
 * @param record - The record to upsert
 * @param exists - Whether the record already exists in the database
 */
export async function upsertData({
  tx,
  table,
  record,
  doesExist,
}: UpsertDataParams): Promise<void> {
  if (!record?.id) return;
  let itemExists = !!doesExist;
  const cfg = getSupastashConfig();
  if (cfg.supastashMode === "ghost") return;

  if (doesExist === undefined) {
    const { doesExist: exists } = await checkIfRecordExistsAndIsNewer(
      table,
      record
    );
    itemExists = exists;
  }
  try {
    const db = tx ?? (await getSupastashDb());

    const columns = await getTableSchema(table);

    const recordToSave = {
      ...record,
      synced_at: new Date().toISOString(),
    };

    if (__DEV__ && getSupastashConfig().debugMode) {
      const unknownKeys = Object.keys(record).filter(
        (key) => !columns.includes(key)
      );
      if (unknownKeys.length > 0 && !warned.get(table)) {
        warned.set(table, true);
        logWarn(
          `⚠️ [Supastash] '${table}' payload contains keys not in local schema: ${unknownKeys.join(
            ", "
          )}. ` + `They will be ignored locally.`
        );
      }
    }

    // Prep for upsert
    const keys = columns;
    const placeholders = keys.map(() => "?").join(", ");

    const updateColumns = keys.filter((key) => key !== "id");
    const updateParts = updateColumns.map((key) => `${key} = ?`);
    const updatePlaceholders = updateParts.join(", ");

    const values = keys.map((key) => stringifyValue(recordToSave[key]));
    const updateValues = updateColumns.map((key) =>
      stringifyValue(recordToSave[key])
    );

    if (itemExists) {
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
    await updateLocalSyncedAt(table, [record.id]);
  } catch (error) {
    logError(`[Supastash] Error upserting data for ${table}`, error);
  }
}

async function checkIfRecordExistsAndIsNewer(table: string, item: any) {
  if (!item?.id) return { doesExist: false, newer: false };
  const db = await getSupastashDb();
  const record = await db.getFirstAsync(
    `SELECT id, updated_at FROM ${table} WHERE id = ?`,
    [item.id]
  );

  if (
    record &&
    new Date(record.updated_at || DEFAULT_DATE) >=
      new Date(item.updated_at || DEFAULT_DATE)
  ) {
    log(`Skipping ${table}:${record.id} - local is newer`);
    return { doesExist: true, newer: false };
  }
  return { doesExist: !!record, newer: true };
}
