import { getSupastashConfig } from "@/core/config";
import { SupabaseQueryReturn, SupastashQuery } from "@/types/query.types";
import { getMethod, operatorMap } from "@/utils/query/remoteDb/queryUtils";

export async function querySupabase<T extends boolean>(
  state: SupastashQuery & { isSingle: T }
): Promise<SupabaseQueryReturn<T>> {
  const { table, method, payload, filters, limit, select, isSingle } = state;

  if (!getSupastashConfig().supabaseClient) {
    throw new Error(`
        [Supastash] Supabase Client is required to perform this operation.
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

  return result;
}
