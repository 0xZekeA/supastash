import { useEffect } from "react";
import { getSupastashConfig } from "../../core/config";
import { supabaseClientErr } from "../supabaseClientErr";
import { buildFilterString } from "./buildFilter";
const hasRegistered = new Map();
const useRealtimeData = (table, queueHandler, options, initialized, realtime) => {
    const { lazy, shouldFetch } = options;
    useEffect(() => {
        if (!realtime || (options.lazy && !initialized) || !shouldFetch) {
            return;
        }
        const filterString = options.filter
            ? buildFilterString(options.filter)
            : undefined;
        if (hasRegistered.get(`${table}:${filterString ?? ""}`))
            return;
        hasRegistered.set(`${table}:${filterString ?? ""}`, true);
        const supabase = getSupastashConfig().supabaseClient;
        if (!supabase) {
            console.error("[Supastash] No supabase client found", supabaseClientErr);
            return;
        }
        const subDetails = filterString
            ? { event: "*", schema: "public", table, filter: filterString }
            : { event: "*", schema: "public", table };
        const subscription = supabase
            .channel(`supastash:realtime:${table}:${filterString ? filterString : ""}`)
            .on("postgres_changes", subDetails, (payload) => {
            console.log("[Supastash] 🔥 GOT PAYLOAD:", payload?.new?.id
                ? payload?.new?.id
                : "No id found for this item", `on table ${table}`, `with event type ${payload.eventType}`);
            queueHandler(payload.eventType, payload.new);
        })
            .subscribe((status, err) => {
            if (err)
                console.error(`[Supastash] 📡 STATUS: ${status} on table ${table}`, err);
        });
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [table, lazy, initialized, realtime, shouldFetch]);
};
export default useRealtimeData;
