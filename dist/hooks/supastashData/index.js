import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import { supastashEventBus } from "../../utils/events/eventBus";
import { buildFilterString } from "../../utils/fetchData/buildFilter";
import useRealtimeData from "../../utils/fetchData/realTimeCall";
import useDataState from "./dataState";
import useEventQueues from "./eventQueues";
import { fetchCalls } from "./fetchCalls";
import { unregisterSub } from "./registerSub";
const tableSubscriptions = new Map();
/**
 * @description
 * React hook to sync and subscribe to local-first data from a Supabase table using Supastash.
 *
 * This hook:
 * - Fetches initial data from local SQLite (offline-first).
 * - Optionally subscribes to Supabase `postgres_changes` for realtime updates.
 * - Batches and flushes changes into state at a controlled interval.
 * - Supports lazy loading, manual triggers, and event callbacks.
 *
 * @example
 * const authenticated = !!session?.user;
 * const { data, dataMap, trigger, cancel } = useSupastashData("users", {
 *   shouldFetch: authenticated,
 *   filter: { column: "user_id", operator: "eq", value: 1 },
 *   flushIntervalMs: 200,
 *   onInsert: (user) => console.log("User added:", user),
 *   lazy: true,
 * });
 *
 * useEffect(() => {
 *   trigger(); // manually start sync
 * }, []);
 *
 * @param table - The table name (must match local SQLite table).
 * @param options - Configuration object:
 *
 * ### Fetch Options:
 * @param options.shouldFetch - If `false`, prevents initial fetch. Defaults to `true`.
 * @param options.lazy - If `true`, disables auto-fetch. Call `trigger()` manually.
 * @param options.limit - Max number of records to load from local DB. Defaults to `200`.
 * @param options.useFilterWhileSyncing - If `true`, applies filter while syncing. Defaults to `true`.
 * @param options.extraMapKey - Field to additionally group data by (`groupedBy`).
 *
 * ### Realtime Options:
 * @param options.realtime - If `true`, subscribes to Supabase realtime. Defaults to `true`.
 * @param options.filter - Structured filter (column, operator, value) for realtime subscription.
 * @param options.flushIntervalMs - How often (ms) to apply batched changes to UI. Defaults to `100`.
 *
 * ### Event Callbacks:
 * @param options.onInsert - Triggered on INSERT event.
 * @param options.onUpdate - Triggered on UPDATE event.
 * @param options.onDelete - Triggered on DELETE event.
 * @param options.onInsertAndUpdate - Triggered on both INSERT and UPDATE.
 * @param options.onPushToRemote - Called when a record is pushed to Supabase.
 *
 * @returns Object with:
 * - `data`: Array of records.
 * - `dataMap`: Map of records keyed by ID.
 * - `groupedBy`: Optional maps grouped by fields (like `chat_id`).
 * - `trigger()`: Manually start sync (used with lazy).
 * - `cancel()`: Cancel a pending or lazy fetch.
 */
export function useSupastashData(table, options = {}) {
    const { filter, lazy = false, flushIntervalMs = 100, shouldFetch = true, realtime = true, } = options;
    const hasTriggeredRef = useRef(false);
    const { dataMap, data, groupedBy, } = useDataState(table);
    const queueHandler = useEventQueues(table, options, flushIntervalMs);
    const { triggerRefresh, trigger, cancel, initialFetchAndSync } = fetchCalls(table, options, hasTriggeredRef);
    useEffect(() => {
        if (!shouldFetch || (lazy && !hasTriggeredRef.current))
            return;
        const subKey = `${table}:${buildFilterString(filter)}`;
        if (!tableSubscriptions.get(subKey)) {
            tableSubscriptions.set(subKey, true);
            initialFetchAndSync();
            const unsub = AppState.addEventListener("change", (state) => {
                if (state === "active") {
                    initialFetchAndSync();
                }
            });
            supastashEventBus.on(`refresh:${table}`, triggerRefresh);
            supastashEventBus.on(`refresh:all`, triggerRefresh);
            return () => {
                supastashEventBus.off?.(`refresh:${table}`, triggerRefresh);
                supastashEventBus.off?.(`refresh:all`, triggerRefresh);
                unsub.remove();
                unregisterSub(table, filter);
            };
        }
    }, [lazy, shouldFetch]);
    // TEMP
    useRealtimeData(table, queueHandler, options, hasTriggeredRef.current, realtime);
    return useMemo(() => ({
        data,
        dataMap,
        trigger,
        cancel,
        groupedBy,
    }), [data]);
}
