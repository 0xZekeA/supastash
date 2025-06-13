import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import {
  CrudMethods,
  SupabaseQueryReturn,
  SupastashQuery,
} from "../../../types/query.types";
import { supastash } from "../builder";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";
import { operatorMap } from "../helpers/remoteDb/queryUtils";
import { permanentlyDeleteData } from "../localDbQuery/delete";

/**
 * Queries the supabase database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function querySupabase<T extends boolean, R, Z>(
  state: SupastashQuery<CrudMethods, T, R>,
  isBatched = false
): Promise<SupabaseQueryReturn<T, Z>> {
  const { table, method, payload, filters, limit, select, isSingle, type } =
    state;

  const config = getSupastashConfig();

  const now = new Date().toISOString();
  let newPayload: any;

  if (Array.isArray(payload) && payload.length > 0) {
    newPayload = payload.map((item: any) => {
      const { synced_at, ...rest } = item;
      return {
        ...rest,
        created_at: item.created_at ?? now,
        updated_at: item.updated_at ?? now,
      };
    });
  } else if (payload) {
    const { synced_at, ...rest } = payload as any;
    newPayload = {
      ...rest,
      created_at: rest.created_at ?? now,
      updated_at: rest.updated_at ?? now,
    };
  }

  if (!config.supabaseClient) {
    throw new Error(
      "[Supastash] Supabase Client is required to perform this operation."
    );
  }

  const supabase = config.supabaseClient;
  let query = supabase.from(table);
  let filterQuery: any;
  const timeStamp = new Date().toISOString();

  switch (method) {
    case "select":
      filterQuery = query.select(select || "*");
      break;
    case "insert":
      if (!newPayload)
        throw new Error("[Supastash] Insert payload is missing.");
      filterQuery = query.insert(newPayload);
      break;
    case "update":
      if (!newPayload)
        throw new Error("[Supastash] Update payload is missing.");
      filterQuery = query.update(newPayload);
      break;
    case "upsert":
      if (!newPayload)
        throw new Error("[Supastash] Upsert payload is missing.");
      filterQuery = query.upsert(newPayload);
      break;
    case "delete":
      filterQuery = query.update({
        deleted_at: timeStamp,
        updated_at: timeStamp,
      });
      break;
    default:
      throw new Error(`[Supastash] Unsupported method "${method}"`);
  }
  if (method !== "upsert") {
    // Apply filters
    if (filters?.length && method !== "insert") {
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
  } else if (!isBatched) {
    filterQuery = filterQuery.select();
  }

  const result = await filterQuery;

  if (
    !result.error &&
    method !== "select" &&
    type !== "remoteOnly" &&
    type !== "remoteFirst"
  ) {
    if (method === "upsert" || method === "insert") {
      const newPayload = Array.isArray(payload) ? payload : [payload];

      const refreshItems = newPayload.map((item: any) => ({
        id: item.id,
        synced_at: new Date().toISOString(),
      }));
      await supastash
        .from(table)
        .upsert(refreshItems)
        .syncMode("localOnly")
        .run();
    }
    if (filters?.length) {
      const db = await getSupastashDb();
      const { clause, values: filterValues } = buildWhereClause(filters ?? []);
      const refreshItems = await db.getAllAsync(
        `SELECT id FROM ${table} ${clause}`,
        filterValues
      );

      const refreshItemsWithSyncedAt = refreshItems.map((item: any) => ({
        id: item.id,
        synced_at: new Date().toISOString(),
      }));

      await supastash
        .from(table)
        .upsert(refreshItemsWithSyncedAt)
        .syncMode("localOnly")
        .run();
      if (method === "delete") {
        await permanentlyDeleteData(table, filters);
      }
    }
  }

  return result;
}
