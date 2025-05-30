import { getSupastashConfig } from "@/core/config";
import { PayloadData } from "@/types/query.types";
import log from "@/utils/logs";
import { getLastPulledInfo, updateLastPulledInfo } from "./getLastPulledInfo";

/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export async function pullData(table: string): Promise<PayloadData[] | null> {
  const lastSyncedAt = await getLastPulledInfo(table);
  const supabase = getSupastashConfig().supabaseClient;

  // Fetch records updated after the last sync
  const { data, error }: { data: any[]; error: any } = await supabase
    .from(table)
    .select("*")
    .gt("updated_at", lastSyncedAt)
    .order("updated_at", { ascending: false });

  if (error) {
    log(`[Supastash] Error fetching from ${table}:`, error.message);
    return null;
  }

  if (!data || data.length === 0) {
    log(`No updates for ${table} at ${lastSyncedAt}`);
    return null;
  }

  log(`Received ${data.length} updates for ${table}`);

  // Reorder data from supabase to put latest update on top
  const reorderedData = data.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Update the supastash_sync_status table with the lastest timestamp
  const lastest = reorderedData[0].updated_at;

  await updateLastPulledInfo(table, lastest);

  return reorderedData;
}
