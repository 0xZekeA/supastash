import { getSupastashConfig } from "@/core/config";
import { PayloadData } from "@/types/query.types";
import log from "@/utils/logs";
import {
  getLastDeletedInfo,
  updateLastDeletedInfo,
} from "./getLastDeletedInfo";

/**
 * Pulls deleted data from the remote database for a given table
 * @param table - The table to pull deleted data from
 * @returns The deleted data from the table as a map of id to record and the reordered data
 */
export async function pullDeletedData(table: string): Promise<{
  deletedDataMap: Map<string, PayloadData>;
  records: PayloadData[];
} | null> {
  const lastDeletedAt = await getLastDeletedInfo(table);
  const supabase = getSupastashConfig().supabaseClient;

  // Fetch records deleted after the last sync
  const { data, error }: { data: any[]; error: any } = await supabase
    .from(table)
    .select("*")
    .gt("deleted_at", lastDeletedAt)
    .order("deleted_at", { ascending: false });

  if (error) {
    log(`[Supastash] Error fetching from ${table}:`, error.message);
    return null;
  }

  if (!data || data.length === 0) {
    log(`No deleted records for ${table} at ${lastDeletedAt}`);
    return null;
  }

  log(`Received ${data.length} deleted records for ${table}`);

  // Reorder data from supabase to put latest deleted on top
  const reorderedData = data.sort(
    (a, b) =>
      new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
  );

  // Update the supastash_deleted_status table with the lastest timestamp
  const lastest = reorderedData[0].deleted_at;

  await updateLastDeletedInfo(table, lastest);

  const deletedDataMap = new Map(reorderedData.map((d) => [d.id, d]));

  return { deletedDataMap, records: reorderedData };
}
