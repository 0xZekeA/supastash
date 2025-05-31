import { getSupaStashDb } from "@/db/dbInitializer";
import { PayloadData } from "@/types/query.types";
import { debounce } from "lodash";
import { setDataMapInBatches } from "./setDataInBatches";

/**
 * Fetches the local data from the database
 * @param table - The name of the table to fetch from
 * @param setData - The function to set the data
 * @param shouldFetch - Whether to fetch the data
 */
let fetchToken = 0;
const fetchLocalDataCore = async (
  table: string,
  setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>,
  setVersion: React.Dispatch<React.SetStateAction<number>>,
  shouldFetch: boolean = true
) => {
  if (!shouldFetch) return;
  const currentToken = ++fetchToken;
  try {
    const db = await getSupaStashDb();
    const localData: PayloadData[] = await db.getAllAsync(
      `SELECT * FROM ${table} WHERE deleted_at IS NULL`
    );

    const dataMap = new Map(localData?.map((item) => [item.id, item]) ?? {});
    if (currentToken !== fetchToken) return;
    setDataMapInBatches(dataMap, setDataMap);
    setVersion((prev) => prev + 1);
  } catch (error) {
    console.error(`[Supastash] Error fetching local data for ${table}:`, error);
  }
};

export const fetchLocalData = debounce(fetchLocalDataCore, 300);
