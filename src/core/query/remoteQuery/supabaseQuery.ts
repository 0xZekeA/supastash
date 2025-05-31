import { getSupastashConfig } from "@/core/config";
import { SupabaseQueryReturn, SupastashQuery } from "@/types/query.types";
import { operatorMap } from "@/utils/query/remoteDb/queryUtils";
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
  const { table, method, payload, filters, limit, select, isSingle, type } =
    state;

  const config = getSupastashConfig();

  if (!config.supabaseClient) {
    throw new Error(
      "[Supastash] Supabase Client is required to perform this operation."
    );
  }

  const supabase = config.supabaseClient;
  let query = supabase.from(table);
  let filterQuery: any;

  switch (method) {
    case "select":
      filterQuery = query.select(select || "*");
      break;
    case "insert":
      if (!payload) throw new Error("[Supastash] Insert payload is missing.");
      filterQuery = query.insert(payload);
      break;
    case "update":
      if (!payload) throw new Error("[Supastash] Update payload is missing.");
      filterQuery = query.update(payload);
      break;
    case "upsert":
      if (!payload) throw new Error("[Supastash] Upsert payload is missing.");
      filterQuery = query.upsert(payload);
      break;
    case "delete":
      filterQuery = query.update({ deleted_at: new Date().toISOString() });
      break;
    default:
      throw new Error(`[Supastash] Unsupported method "${method}"`);
  }

  // Apply filters
  if (filters?.length) {
    for (const { column, operator, value } of filters) {
      const op = operatorMap(operator);
      filterQuery = filterQuery[op](column, value);
    }
  }

  if (limit != null) {
    filterQuery = filterQuery.limit(limit);
  }

  if (isSingle) {
    filterQuery = filterQuery.single();
  }

  const result = await filterQuery;

  if (
    !result.error &&
    method !== "select" &&
    type !== "remoteOnly" &&
    type !== "remoteFirst"
  ) {
    if (filters?.length) {
      await updateData(table, { synced_at: new Date().toISOString() }, filters);
      if (method === "delete") {
        await permanentlyDeleteData(table, filters);
      }
    }
  }

  return result;
}
