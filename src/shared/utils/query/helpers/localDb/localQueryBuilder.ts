import { CrudMethods, SupastashQuery } from "../../../../types/query.types";
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
  state: SupastashQuery<CrudMethods, boolean, R>
) {
  return async () =>
    await selectData<T, R, Z>({ ...state, select: state.select || "*" });
}

/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export function buildInsert<T extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, boolean, R>
) {
  const payload = state.payload;
  const newPayload = payload
    ? Array.isArray(payload)
      ? payload
      : [payload]
    : null;
  return async () =>
    await insertData<T, R, Z>({ ...state, payload: newPayload });
}

/**
 * Builds an update query
 *
 * @returns query
 */
export function buildUpdate<T extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, boolean, R>
) {
  return async () => await updateData<T, R, Z>(state);
}

/**
 * Builds a delete query
 *
 * @returns query
 */
export function buildDelete<Z = any>(
  state: SupastashQuery<CrudMethods, boolean, Z>
) {
  return async () => await deleteData<Z>(state);
}

export function buildUpsert<T extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, boolean, R>
) {
  const payload = state.payload;
  const newPayload = payload
    ? Array.isArray(payload)
      ? payload
      : [payload]
    : null;
  return async () =>
    await upsertData<T, R, Z>({ ...state, payload: newPayload });
}
