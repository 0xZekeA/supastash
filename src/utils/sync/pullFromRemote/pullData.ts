import { getSupastashConfig } from "../../../core/config";
import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import log from "../../logs";
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

  let filteredQuery = supabase
    .from(table)
    .select("*")
    .or(`created_at.gte.${lastCreatedAt},updated_at.gte.${lastSyncedAt}`)
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
    filteredQuery = (filteredQuery as any)[filter.operator](
      filter.column,
      filter.value
    );
  }

  // Fetch records where created_at >= lastCreatedAt OR updated_at >= lastSyncedAt
  const { data, error }: { data: PayloadData[] | null; error: any } =
    await filteredQuery;

  if (error) {
    log(`[Supastash] Error fetching from ${table}:`, error.message);
    return null;
  }

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
  const { createdMaxDate, updatedMaxDate } = getMaxDate(data);

  if (updatedMaxDate) {
    await updateLastPulledInfo(table, updatedMaxDate);
  }

  if (createdMaxDate) {
    await updateLastCreatedInfo(table, createdMaxDate);
  }

  return data;
}

function getMaxDate(data: PayloadData[]): {
  createdMaxDate: string | null;
  updatedMaxDate: string | null;
} {
  let createdMaxDate = RANDOM_OLD_DATE;
  let updatedMaxDate = RANDOM_OLD_DATE;
  const createdColumn = "created_at";
  const updatedColumn = "updated_at";

  for (const item of data) {
    const createdValue = item[createdColumn];
    const updatedValue = item[updatedColumn];

    if (typeof createdValue === "string" && !isNaN(Date.parse(createdValue))) {
      createdMaxDate = new Date(
        Math.max(
          new Date(createdMaxDate).getTime(),
          new Date(createdValue).getTime()
        )
      ).toISOString();
    }

    if (typeof updatedValue === "string" && !isNaN(Date.parse(updatedValue))) {
      updatedMaxDate = new Date(
        Math.max(
          new Date(updatedMaxDate).getTime(),
          new Date(updatedValue).getTime()
        )
      ).toISOString();
    }
  }

  return {
    createdMaxDate: createdMaxDate === RANDOM_OLD_DATE ? null : createdMaxDate,
    updatedMaxDate: updatedMaxDate === RANDOM_OLD_DATE ? null : updatedMaxDate,
  };
}
