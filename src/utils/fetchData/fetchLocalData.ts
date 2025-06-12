import { getSupastashDb } from "../../db/dbInitializer";
import { PayloadData } from "../../types/query.types";

let isFetching = new Map<string, boolean>();

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

/**
 * Fetches the local data from the database
 * @param table - The name of the table to fetch from
 * @param setData - The function to set the data
 * @param shouldFetch - Whether to fetch the data
 */
export async function fetchLocalData(
  table: string,
  setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>,
  setVersion: React.Dispatch<React.SetStateAction<string>>,
  shouldFetch: boolean = true,
  limit: number = 200
) {
  if (!shouldFetch || isFetching.get(table)) return;
  isFetching.set(table, true);

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }

  const limitClause = `LIMIT ${limit ?? 200}`;

  try {
    const db = await getSupastashDb();
    const localData: PayloadData[] = await db.getAllAsync(
      `SELECT * FROM ${table} WHERE deleted_at IS NULL ${limitClause}`
    );

    const dataMap = new Map(
      localData
        ?.map((item) => {
          if (!item.id) return undefined;
          return [item.id, parseJSONColumns(item)] as [string, PayloadData];
        })
        .filter((item): item is [string, PayloadData] => item !== undefined) ??
        []
    );

    setDataMap(dataMap);
    setVersion(`${table}-${Date.now()}`);
  } catch (error) {
    console.error(`[Supastash] Error fetching local data for ${table}:`, error);
  } finally {
    isFetching.delete(table);
  }
}
