import { getSupastashConfig } from "../../../core/config";
import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import log, { logWarn } from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import {
  getLastCreatedInfo,
  updateLastCreatedInfo,
} from "./getLastCreatedInfo";
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

const DEFAULT_MAX_PULL_ATTEMPTS = 150;
let timesPulled = new Map<string, number>();
let lastPulled = new Map<string, number>();

const RANDOM_OLD_DATE = "2000-01-01T00:00:00Z";
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
  const lastCreatedAt = await getLastCreatedInfo(table);
  const supabase = getSupastashConfig().supabaseClient;

  if (!supabase)
    throw new Error(`No supabase client found: ${supabaseClientErr}`);

  let filteredLastCreatedQuery = supabase
    .from(table)
    .select("*")
    .gte("created_at", lastCreatedAt || RANDOM_OLD_DATE)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });

  let filteredLastSyncedQuery = supabase
    .from(table)
    .select("*")
    .gte("updated_at", lastSyncedAt || RANDOM_OLD_DATE)
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

  const isValidValue =
    filter &&
    (filter.operator === "is" ||
      filter.operator === "in" ||
      typeof filter.value !== "undefined");

  if (
    filter?.operator &&
    validOperators.has(filter.operator) &&
    filter.column &&
    isValidValue
  ) {
    filteredLastCreatedQuery = (filteredLastCreatedQuery as any)[
      filter.operator
    ](filter.column, filter.value);
    filteredLastSyncedQuery = (filteredLastSyncedQuery as any)[filter.operator](
      filter.column,
      filter.value
    );
  }

  // Fetch records where created_at >= lastCreatedAt OR updated_at >= lastSyncedAt
  const {
    data: lastCreatedData,
    error: lastCreatedError,
  }: { data: PayloadData[] | null; error: any } =
    await filteredLastCreatedQuery;
  const {
    data: lastSyncedData,
    error: lastSyncedError,
  }: { data: PayloadData[] | null; error: any } = await filteredLastSyncedQuery;

  if (lastCreatedError || lastSyncedError) {
    log(
      `[Supastash] Error fetching from ${table}:`,
      lastCreatedError?.message || lastSyncedError?.message
    );
    return null;
  }

  const allRows = [...(lastCreatedData ?? []), ...(lastSyncedData ?? [])];

  const merged: Record<string, PayloadData> = {};
  for (const row of allRows) {
    if (!row.id) {
      logWarn(`[Supastash] Skipped row without id from "${table}":`, row);
      continue;
    }
    const id = row.id;
    merged[id] = row;
  }
  const data = Object.values(merged);

  if (!data || data.length === 0) {
    timesPulled.set(table, (timesPulled.get(table) || 0) + 1);
    if ((timesPulled.get(table) || 0) >= DEFAULT_MAX_PULL_ATTEMPTS) {
      const timeSinceLastPull = Date.now() - (lastPulled.get(table) || 0);
      lastPulled.set(table, Date.now());
      log(
        `[Supastash] No updates for ${table} at ${lastSyncedAt} (times pulled: ${timesPulled.get(
          table
        )}) in the last ${timeSinceLastPull}ms`
      );
      timesPulled.set(table, 0);
    }
    return null;
  }

  log(`Received ${data.length} updates for ${table}`);

  // Update the sync status tables with the latest timestamps
  const createdMaxDate = getMaxCreatedDate(lastCreatedData ?? []);
  const updatedMaxDate = getMaxUpdatedDate(lastSyncedData ?? []);

  if (updatedMaxDate) {
    await updateLastPulledInfo(table, updatedMaxDate);
  }

  if (createdMaxDate) {
    await updateLastCreatedInfo(table, createdMaxDate);
  }

  return data;
}

export function getMaxCreatedDate(data: PayloadData[]): string | null {
  if (!data || data.length === 0) return null;
  const createdColumn = "created_at";
  let maxDate = RANDOM_OLD_DATE;

  for (const item of data) {
    const createdValue = item[createdColumn];
    if (typeof createdValue === "string" && !isNaN(Date.parse(createdValue))) {
      const createdTime = new Date(createdValue).getTime();
      if (createdTime > new Date(maxDate).getTime()) {
        maxDate = new Date(createdTime).toISOString();
      }
    }
  }

  return maxDate === RANDOM_OLD_DATE ? null : maxDate;
}

export function getMaxUpdatedDate(data: PayloadData[]): string | null {
  if (!data || data.length === 0) return null;
  const updatedColumn = "updated_at";
  let maxDate = RANDOM_OLD_DATE;

  for (const item of data) {
    const updatedValue = item[updatedColumn];
    if (typeof updatedValue === "string" && !isNaN(Date.parse(updatedValue))) {
      const updatedTime = new Date(updatedValue).getTime();
      if (updatedTime > new Date(maxDate).getTime()) {
        maxDate = new Date(updatedTime).toISOString();
      }
    }
  }

  return maxDate === RANDOM_OLD_DATE ? null : maxDate;
}
