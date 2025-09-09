import {
  CrudMethods,
  FilterCalls,
  SupastashQuery,
  SyncMode,
} from "../../../../types/query.types";
import { deleteData } from "../../localDbQuery/delete";
import { insertData } from "../../localDbQuery/insert";
import { selectData } from "../../localDbQuery/select";
import { updateData } from "../../localDbQuery/update";
import { upsertData } from "../../localDbQuery/upsert";

/**
 * Builds a select query
 *
 * @param table - The name of the table to query
 * @param select - The columns to select
 * @param filters - The filters to apply
 * @param limit - The limit to apply
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns query
 */
export function buildSelect<T extends boolean, R, Z>(
  table: string,
  select: string | null,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: T
) {
  return async () =>
    await selectData<T, R, Z>(table, select || "*", filters, limit, isSingle);
}

/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export function buildInsert<T extends boolean, R, Z>(
  table: string,
  payload: R | R[] | null,
  syncMode?: SyncMode,
  isSingle?: T
) {
  const newPayload = payload
    ? Array.isArray(payload)
      ? payload
      : [payload]
    : null;
  return async () =>
    await insertData<T, R, Z>(table, newPayload, syncMode, isSingle);
}

/**
 * Builds an update query
 *
 * @returns query
 */
export function buildUpdate<T extends boolean, R, Z>(
  table: string,
  payload: R | null,
  filters: FilterCalls[] | null,
  syncMode?: SyncMode,
  isSingle?: T,
  preserveTimestamp?: boolean
) {
  return async () =>
    await updateData<T, R, Z>(
      table,
      payload,
      filters,
      syncMode,
      isSingle,
      preserveTimestamp
    );
}

/**
 * Builds a delete query
 *
 * @returns query
 */
export function buildDelete<Z = any>(
  table: string,
  filters: FilterCalls[] | null,
  syncMode?: SyncMode
) {
  return async () => await deleteData<Z>(table, filters, syncMode);
}

export function buildUpsert<T extends boolean, R, Z>(
  table: string,
  payload: R | R[] | null,
  state: SupastashQuery<CrudMethods, T, R>,
  syncMode?: SyncMode,
  isSingle?: T,
  onConflictKeys?: string[],
  preserveTimestamp?: boolean
) {
  return async () =>
    await upsertData<T, R, Z>(
      table,
      payload,
      state,
      syncMode,
      isSingle,
      onConflictKeys,
      preserveTimestamp
    );
}
