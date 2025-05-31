import { deleteData } from "@/core/query/localDbQuery/delete";
import { insertData } from "@/core/query/localDbQuery/insert";
import { selectData } from "@/core/query/localDbQuery/select";
import { updateData } from "@/core/query/localDbQuery/update";
import { upsertData } from "@/core/query/localDbQuery/upsert";

import { FilterCalls, PayloadData, SyncMode } from "@/types/query.types";

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
export const buildSelect = <T extends boolean>(
  table: string,
  select: string | null,
  filters: FilterCalls[] | null,
  limit: number | null,
  isSingle: T
) => {
  return async () =>
    await selectData<T>(table, select || "*", filters, limit, isSingle);
};

/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export const buildInsert = (
  table: string,
  payload: PayloadData | null,
  syncMode?: SyncMode
) => {
  return async () => await insertData(table, payload, syncMode);
};

/**
 * Builds an update query
 *
 * @returns query
 */
export const buildUpdate = (
  table: string,
  payload: PayloadData | null,
  filters: FilterCalls[] | null,
  syncMode?: SyncMode
) => {
  return async () => await updateData(table, payload, filters, syncMode);
};

/**
 * Builds a delete query
 *
 * @returns query
 */
export const buildDelete = (table: string, filters: FilterCalls[] | null) => {
  return async () => await deleteData(table, filters);
};

export const buildUpsert = (
  table: string,
  payload: PayloadData | null,
  filters: FilterCalls[] | null,
  syncMode?: SyncMode
) => {
  return async () => await upsertData(table, payload, filters, syncMode);
};
