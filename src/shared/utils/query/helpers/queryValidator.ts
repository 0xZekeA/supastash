import { CrudMethods, SupastashQuery } from "../../../types/query.types";

/**
 * Validates the query
 * @param state - The query to validate
 */
export function validateQuery<T extends CrudMethods, U extends boolean, R>(
  state: SupastashQuery<T, U, R>
) {
  if (!state.table) {
    throw new Error("Table name is required");
  }

  if (!state.method) {
    throw new Error("CRUD method is required");
  }

  if (state.method === "insert" && !state.payload) {
    throw new Error("No data was added to insert query");
  }

  if (state.method === "update" && !state.payload) {
    throw new Error("No data was added to update query");
  }
  if (
    state.method === "update" &&
    state.payload &&
    Array.isArray(state.payload) &&
    state.payload.length > 1
  ) {
    throw new Error(
      "Payload must be a single object for update query. Use upsert for multiple rows."
    );
  }

  if (
    (state.method === "delete" || state.method === "update") &&
    (!state.filters || state.filters.length === 0)
  ) {
    throw new Error(`
        Filters are required to perform this operation.
        Please add filters to the ${state.method} query on table ${state.table}
    `);
  }

  if (state.payload && typeof state.payload !== "object")
    throw new Error(
      `Invalid payload type: ${typeof state.payload} for ${state.table} on ${
        state.method
      }`
    );
}
