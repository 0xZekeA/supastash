import { useEffect, useMemo } from "react";
import { getSupastashConfig } from "../../core/config";
import { logError } from "../logs";
import { supabaseClientErr } from "../supabaseClientErr";
import { buildFilterString } from "./buildFilter";
const hasRegistered = new Map();
const useRealtimeData = (table, queueHandler, options, initialized, realtime) => {
    const { lazy, shouldFetch } = options;
    const filterString = useMemo(() => buildFilterString(options.filter), [options.filter]);
    const subKey = useMemo(() => `${table}:${filterString ?? ""}`, [table, filterString]);
    useEffect(() => {
        if (!realtime || (options.lazy && !initialized) || !shouldFetch) {
            return;
        }
        if (hasRegistered.get(subKey))
            return;
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
            .channel(`supastash:realtime:${table}:${filterString ? filterString : ""}`)
            .on("postgres_changes", subDetails, (payload) => {
            queueHandler(payload.eventType, payload.new);
        })
            .subscribe();
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [table, lazy, initialized, realtime, shouldFetch]);
};
export default useRealtimeData;
