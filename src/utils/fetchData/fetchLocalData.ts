import { getSupastashDb } from "../../db/dbInitializer";
import { localCache } from "../../store/localCache";
import { PayloadData } from "../../types/query.types";
import log, { logError, logWarn } from "../logs";
import { notifySubscribers } from "./snapShot";

const fetchingPromises = new Map<
  string,
  Promise<{
    data: PayloadData[];
    dataMap: Map<string, PayloadData>;
    groupedBy: Record<string, Map<any, PayloadData[]>>;
  } | null>
>();
const versionMap = new Map<string, number[]>();
const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

function parseJSONColumns<T extends Record<string, any>>(row: T): T {
  const parsedRow: Record<string, any> = { ...row };

  for (const key in parsedRow) {
    const value = parsedRow[key];

    if (
      typeof value === "string" &&
      (value.startsWith("{") || value.startsWith("["))
    ) {
      try {
        parsedRow[key] = JSON.parse(value);
      } catch {}
    }
  }

  return parsedRow as T;
}

function getNewVersion(table: string): void {
  const queue = versionMap.get(table) ?? [];
  queue.push(Date.now());
  versionMap.set(table, queue);

  const timeoutMs = queue.length > 30 ? 800 : 500;

  clearTimeout(debounceMap.get(table));
  const timeout = setTimeout(() => {
    if (queue.length > 10) {
      logWarn(
        `[Supastash] Table "${table}" is noisy: ${queue.length} events in ${timeoutMs}ms`
      );
    }
    versionMap.delete(table);
    notifySubscribers(table);
    debounceMap.delete(table);
  }, timeoutMs);
  debounceMap.set(table, timeout);
}

const timesFetched = new Map<string, number>();

/**
 * Fetches the local data from the database
 * @param table - The table name to fetch from
 * @param shouldFetch - Whether to fetch the data
 * @param limit - Optional limit for rows
 * @param extraMapKeys - Optional fields to group data by
 */
export async function fetchLocalData<R>(
  table: string,
  shouldFetch: boolean = true,
  limit: number = 200,
  extraMapKeys?: (keyof R)[],
  daylength?: number
): Promise<{
  data: PayloadData[];
  dataMap: Map<string, PayloadData>;
  groupedBy: {
    [K in keyof R]: Map<R[K], Array<PayloadData>>;
  };
} | null> {
  if (!shouldFetch || fetchingPromises.has(table)) return null;
  timesFetched.set(table, (timesFetched.get(table) || 0) + 1);
  if ((timesFetched.get(table) || 0) > 150) {
    log(
      `[Supastash] Fetching data for ${table} (times fetched: ${timesFetched.get(
        table
      )})`
    );
    timesFetched.delete(table);
  }
  const fetchPromise = (async () => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const day = Number(daylength);
    const daylengthClause =
      !isNaN(day) && day > 0
        ? `AND datetime(created_at) >= datetime('now', '-${day} days')`
        : "";

    try {
      const db = await getSupastashDb();
      const localData: PayloadData[] = await db.getAllAsync(
        `SELECT * FROM ${table} WHERE deleted_at IS NULL ${daylengthClause} ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );

      const dataMap = new Map<string, PayloadData>();
      const data: PayloadData[] = [];
      const groupedBy: {
        [K in keyof R]: Map<R[K], Array<PayloadData>>;
      } = {} as {
        [K in keyof R]: Map<R[K], Array<PayloadData>>;
      };

      for (const item of localData) {
        if (!item.id) continue;
        const parsedItem = parseJSONColumns(item);
        dataMap.set(item.id, parsedItem);
        data.push(parsedItem);
        if (extraMapKeys?.length) {
          for (const key of extraMapKeys) {
            if (item[key] == null) {
              logWarn(
                `[Supastash] Item ${item.id} has no ${String(key)} field`
              );
              continue;
            }
            const groupVal = item[key];
            if (!groupedBy[key]) groupedBy[key] = new Map();
            if (!groupedBy[key].has(groupVal)) groupedBy[key].set(groupVal, []);

            groupedBy[key].get(groupVal)?.push(parsedItem);
          }
        }
      }
      localCache.set(table, {
        dataMap,
        data,
        groupedBy: groupedBy ?? undefined,
      });
      getNewVersion(table);
      return { data, dataMap, groupedBy };
    } catch (error) {
      logError(`[Supastash] Error fetching local data for ${table}:`, error);
      return null;
    }
  })();
  fetchingPromises.set(table, fetchPromise);
  try {
    const result = await fetchPromise;
    return result;
  } finally {
    fetchingPromises.delete(table);
  }
}
