import { getSupastashConfig } from "@/core/config";
import { SupabaseQueryReturn, SupastashQuery } from "@/types/query.types";
import { getMethod, operatorMap } from "@/utils/query/remoteDb/queryUtils";
import { permanentlyDeleteData } from "../localDbQuery/delete";
import { updateData } from "../localDbQuery/update";

/**
 * Queries the supabase database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function querySupabase<T extends boolean>(
  state: SupastashQuery & { isSingle: T }
): Promise<SupabaseQueryReturn<T>> {
  const { table, method, payload, filters, limit, select, isSingle } = state;

  if (!getSupastashConfig().supabaseClient) {
    throw new Error(`
        Supabase Client is required to perform this operation.
        Please add Supabase Client to the config file
    `);
  }

  const supabase = getSupastashConfig().supabaseClient;

  let query = supabase.from(table);

  // Get Method
  getMethod(query, method, select, payload);

  // Apply filters
  if (filters) {
    for (const filter of filters) {
      const { column, operator, value } = filter;
      query = query[operatorMap(operator)](column, value);
    }
  }

  if (limit !== null) {
    query = query.limit(limit);
  }

  if (isSingle) {
    query = query.single();
  }

  const result = await query;

  if (!result.error && method !== "select") {
    await updateData(table, { synced_at: new Date().toISOString() }, filters); // Update the local database with the synced_at timestamp
    if (method === "delete") {
      await permanentlyDeleteData(table, filters); // Permanently delete the data from the local database
    }
  }

  return result;
}
