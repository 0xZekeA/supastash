import { useEffect, useMemo, useState } from "react";
import { getSupastashConfig } from "../../core/config";
import { PayloadData } from "../../types/query.types";
import { RealtimeOptions } from "../../types/realtimeData.types";
import { supastashEventBus } from "../events/eventBus";
import { logError } from "../logs";
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
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!realtime || (options.lazy && !initialized) || !shouldFetch) {
      return;
    }
    if (hasRegistered.get(subKey)) return;

    const supabase = getSupastashConfig().supabaseClient;
    if (!supabase) {
      logError("[Supastash] No supabase client found", supabaseClientErr);
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
        queueHandler(payload.eventType, payload.new);
      })
      .subscribe();

    const restartRealtime = () => {
      setVersion((prev) => prev + 1);
    };
    const unsubscribeRealtime = () => {
      hasRegistered.delete(subKey);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };

    supastashEventBus.on("restartRealtime", restartRealtime);
    supastashEventBus.on("unsubscribeRealtime", unsubscribeRealtime);

    return () => {
      hasRegistered.delete(subKey);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      supastashEventBus.off("restartRealtime", restartRealtime);
      supastashEventBus.off("unsubscribeRealtime", unsubscribeRealtime);
    };
  }, [
    table,
    lazy,
    initialized,
    realtime,
    shouldFetch,
    subKey,
    filterString,
    version,
  ]);
};

export default useRealtimeData;
