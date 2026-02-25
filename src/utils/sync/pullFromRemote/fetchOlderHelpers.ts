import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
import { ReusedHelpers } from "../../../utils/reusedHelpers";
import { SupastashError } from "../../errorHandler";
import { buildFilterForSql } from "../../fetchData/buildFilter";
import { logWarn } from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { upsertData } from "./updateLocalDb";

const DEFAULT_DATE = "2000-01-01T00:00:00Z";
const DEFAULT_ID = "00000000-0000-0000-0000-000000000000";

export const FetchOlderHelpers = {
  validateBoundaryTs({
    boundaryTs,
    earliestDate,
  }: {
    boundaryTs: string;
    earliestDate: string;
  }) {
    const boundaryTsDate = new Date(boundaryTs);
    if (isNaN(boundaryTsDate.getTime())) {
      logWarn(`Invalid boundary timestamp: ${boundaryTs}`);
      throw new SupastashError(
        `Invalid boundary timestamp: ${boundaryTs}`,
        "INVALID_BOUNDARY_TS"
      );
    }
    if (boundaryTsDate > new Date(earliestDate)) {
      throw new SupastashError(
        `Boundary timestamp is more recent than oldest data: ${boundaryTs} > ${earliestDate}`,
        "BOUNDARY_TS_MORE_RECENT_THAN_OLDEST_DATA"
      );
    }
  },
  async getLookbackDays({
    table,
    filters,
  }: {
    table: string;
    filters?: SupastashFilter[];
  }) {
    // If no cursor, build the SQL filter
    let sqlFilter = "";
    if (filters) {
      for (const filter of filters) {
        sqlFilter += buildFilterForSql(filter);
      }
    }

    // Fetch the earliest date and id
    const db = await getSupastashDb();
    const result = await db.getFirstAsync(`
        SELECT id, created_at FROM ${table} 
        ${sqlFilter}
        ORDER BY created_at ASC, id ASC
        LIMIT 1
        `);

    if (!result) return { createdAt: DEFAULT_DATE, id: DEFAULT_ID };

    return { createdAt: result.created_at, id: result.id };
  },

  async fetchData({
    table,
    filters,
    limit,
    earliestDate,
    boundaryTs,
    earliestId,
  }: {
    table: string;
    filters?: SupastashFilter[];
    limit: number;
    boundaryTs?: string;
    earliestDate: string;
    earliestId: string;
  }) {
    const supabase = getSupastashConfig().supabaseClient;
    if (!supabase)
      throw new Error(`No supabase client found: ${supabaseClientErr}`);

    let cursorId = earliestId;
    let cursorDate = earliestDate;
    const results: PayloadData[] = [];
    let remainingLimit = limit;

    while (true) {
      const pageSize = Math.min(1000, remainingLimit);

      // Build the query
      let q = supabase
        .from(table)
        .select("*")
        .limit(pageSize)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .is("deleted_at", null);

      q = q
        .or(
          `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
        )
        .gte("created_at", boundaryTs ?? DEFAULT_DATE);

      if (filters) {
        q = ReusedHelpers.applyFilters(q, filters, table);
      }

      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) break;
      results.push(...data);
      const last = data[data.length - 1];
      cursorId = last.id;
      cursorDate = last.created_at;

      if (data.length < pageSize) {
        break;
      }

      if (remainingLimit <= pageSize) {
        break;
      }

      remainingLimit -= pageSize;
    }

    return results;
  },
  handleError(error: SupastashError): {
    hasMore: boolean;
    data: PayloadData[];
  } {
    switch (error.code) {
      case "INVALID_BOUNDARY_TS":
        logWarn(error.message);
        return { hasMore: false, data: [] };
      case "BOUNDARY_TS_MORE_RECENT_THAN_OLDEST_DATA":
        logWarn(error.message);
        return { hasMore: false, data: [] };
      default:
        throw error;
    }
  },

  async storeToDb({ table, data }: { table: string; data: PayloadData[] }) {
    if (data.length === 0) return;
    const batchSize = 500;
    for (let i = 0; i < data.length; i++) {
      await upsertData(table, data[i]);

      if ((i + 1) % batchSize === 0) {
        await new Promise((res) => setTimeout(res, 0));
      }
    }
  },
};
