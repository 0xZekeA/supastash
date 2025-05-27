import { SupastashQuery } from "@/types/query.types";

export function validateQuery(state: SupastashQuery) {
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

  if (state.method === "delete" && state.filters?.length === 0) {
    throw new Error("No filters were added to delete query");
  }
}
