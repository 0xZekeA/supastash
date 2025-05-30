import { PayloadData } from "@/types/query.types";
import { RealtimeOptions } from "@/types/realtimeData.types";
import { useEffect } from "react";
import { getSupastashConfig } from "../config";

function useRealtimeSubscription(
  table: string,
  filterString: string | undefined,
  queueHandler: (eventType: string, data: PayloadData) => void,
  options: RealtimeOptions,
  initialized: boolean
) {
  const supabase = getSupastashConfig().supabaseClient;

  useEffect(() => {
    if (!supabase) {
      console.error("No supabase client found");
      return;
    }

    if (options.lazy && !initialized) return;

    const sub = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: filterString,
        },
        (payload: any) => {
          const data = payload.new || payload.old;
          queueHandler(payload.eventType, data);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [table, filterString]);
}

export default useRealtimeSubscription;
