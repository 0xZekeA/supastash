import { useEffect, useMemo } from "react";
import { getSupastashConfig } from "../../core/config";
import { PayloadData } from "../../types/query.types";
import { RealtimeOptions } from "../../types/realtimeData.types";
import { supabaseClientErr } from "../supabaseClientErr";
import { buildFilterString } from "./buildFilter";

const hasRegistered = new Map<string, boolean>();

const useRealtimeData = (
  table: string,
  queueHandler: (eventType: string, data: PayloadData) => void,
  options: RealtimeOptions,
  initialized: boolean,
  realtime: boolean
) => {
  const { lazy, shouldFetch } = options;
  const filterString = useMemo(
    () => buildFilterString(options.filter),
    [options.filter]
  );
  const subKey = useMemo(
    () => `${table}:${filterString ?? ""}`,
    [table, filterString]
  );
  useEffect(() => {
    if (!realtime || (options.lazy && !initialized) || !shouldFetch) {
      return;
    }
    if (hasRegistered.get(subKey)) return;

    const supabase = getSupastashConfig().supabaseClient;
    if (!supabase) {
      console.error("[Supastash] No supabase client found", supabaseClientErr);
      return;
    }

    hasRegistered.set(subKey, true);

    const subDetails = filterString
      ? { event: "*", schema: "public", table, filter: filterString }
      : { event: "*", schema: "public", table };

    const subscription = supabase
      .channel(
        `supastash:realtime:${table}:${filterString ? filterString : ""}`
      )
      .on("postgres_changes", subDetails as any, (payload) => {
        console.log(
          "[Supastash] 🔥 GOT PAYLOAD:",
          (payload?.new as any)?.id
            ? (payload?.new as any)?.id
            : "No id found for this item",
          `on table ${table}`,
          `with event type ${payload.eventType}`
        );
        queueHandler(payload.eventType, payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [table, lazy, initialized, realtime, shouldFetch]);
};

export default useRealtimeData;
