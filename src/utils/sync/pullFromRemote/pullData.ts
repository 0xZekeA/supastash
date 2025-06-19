import { getSupastashConfig } from "../../../core/config";
import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import { getLastPulledInfo, updateLastPulledInfo } from "./getLastPulledInfo";

const validOperators = new Set([
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
  "like",
  "ilike",
  "is",
  "in",
]);

let timesPulled = 0;
let lastPulled = 0;
/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export async function pullData(
  table: string,
  filter?: RealtimeFilter
): Promise<PayloadData[] | null> {
  const lastSyncedAt = await getLastPulledInfo(table);
  const supabase = getSupastashConfig().supabaseClient;

  if (!supabase)
    throw new Error(`No supabase client found: ${supabaseClientErr}`);

  let filteredQuery = supabase
    .from(table)
    .select("*")
    .gt("updated_at", lastSyncedAt)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (
    filter &&
    (!filter.operator ||
      !validOperators.has(filter.operator) ||
      !filter.column ||
      !filter.value)
  ) {
    throw new Error(
      `Invalid filter: ${JSON.stringify(filter)} for table ${table}`
    );
  }

  if (
    filter?.operator &&
    validOperators.has(filter.operator) &&
    filter.column &&
    filter.value
  ) {
    filteredQuery = (filteredQuery as any)[filter.operator](
      filter.column,
      filter.value
    );
  }

  // Fetch records updated after the last sync
  const { data, error }: { data: PayloadData[] | null; error: any } =
    await filteredQuery;

  if (error) {
    log(`[Supastash] Error fetching from ${table}:`, error.message);
    return null;
  }

  if (!data || data.length === 0) {
    timesPulled++;
    if (timesPulled >= 150) {
      const timeSinceLastPull = Date.now() - lastPulled;
      lastPulled = Date.now();
      log(
        `[Supastash] No updates for ${table} at ${lastSyncedAt} (times pulled: ${timesPulled}) in the last ${timeSinceLastPull}ms`
      );
      timesPulled = 0;
    }
    return null;
  }

  log(`Received ${data.length} updates for ${table}`);

  // Update the supastash_sync_status table with the lastest timestamp
  const lastest = data.find((r) => r.updated_at)?.updated_at;

  if (lastest) {
    await updateLastPulledInfo(table, lastest);
  }

  return data;
}
