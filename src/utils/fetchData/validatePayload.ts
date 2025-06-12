import { PayloadData } from "../../types/query.types";

/**
 * Validates the payload
 * @param payload - The payload to validate
 */
export async function validatePayload(payload: PayloadData) {
  if (!payload.id) {
    throw new Error("Unique 'id' column of type uuid/text is required");
  }

  if (!payload.updated_at) {
    throw new Error("'updated_at' column of type timestampz is required");
  }

  if (!payload.created_at) {
    throw new Error("'created_at' column of type timestampz is required");
  }

  if (!payload.deleted_at) {
    throw new Error("'deleted_at' column of type timestampz is required");
  }
}
