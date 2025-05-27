import { deleteData } from "@/core/query/localDbQuery/delete";
import { insertData } from "@/core/query/localDbQuery/insert";
import { selectData } from "@/core/query/localDbQuery/select";
import { updateData } from "@/core/query/localDbQuery/update";

import { FilterCalls, PayloadData } from "@/types/query.types";

/**
 * Builds a select query
 *
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
 * @returns query
 */
export const buildInsert = (table: string, payload: PayloadData | null) => {
  return async () => await insertData(table, payload);
};

/**
 * Builds an update query
 *
 * @returns query
 */
export const buildUpdate = (
  table: string,
  payload: PayloadData | null,
  filters: FilterCalls[] | null
) => {
  return async () => await updateData(table, payload, filters);
};

/**
 * Builds a delete query
 *
 * @returns query
 */
export const buildDelete = (table: string, filters: FilterCalls[] | null) => {
  return async () => await deleteData(table, filters);
};
