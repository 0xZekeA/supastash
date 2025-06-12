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
 * React hook to sync and subscribe to local-first data from a Supabase table.
 *
 * - Fetches initial data from a local SQLite table using Supastash.
 * - Subscribes to Supabase `postgres_changes` for INSERT, UPDATE, DELETE events.
 * - Batches updates and applies them to local state at controlled intervals.
 * - Supports optional callbacks for reacting to specific event types.
 * - Lazy loading and manual triggers are supported for better control in UI flows.
 *
 * @example
 * const authenticated = !!session?.user;
 *
 * const { data, dataMap, trigger, cancel } = useSupastashData("users", {
 *   filter: {
 *     column: "user_id",
 *     operator: "eq",
 *     value: 1,
 *   },
 *   shouldFetch: authenticated, // Only fetch if allowed
 *   flushIntervalMs: 200,
 *   onInsert: (user) => console.log("User added:", user),
 *   lazy: true, // Don't fetch or subscribe until trigger() is called
 * });
 *
 * useEffect(() => {
 *   trigger(); // Manually start loading
 * }, []);
 *
 * @param table - The name of the table to subscribe to (must match the local table name).
 * @param options.shouldFetch - If true, loads data from the local DB on mount. Defaults to true.
 * @param options.filter - Optional structured filter for realtime subscription.
 * @param options.flushIntervalMs - Interval in ms to flush batched changes into state. Defaults to 100ms.
 * @param options.lazy - If true, disables auto-fetch. Use `trigger()` to manually start.
 * @param options.onInsert - Optional callback triggered on INSERT events.
 * @param options.onUpdate - Optional callback triggered on UPDATE events.
 * @param options.onDelete - Optional callback triggered on DELETE events.
 * @param options.realtime - If true, subscribes to realtime changes. Defaults to true.
 * @param options.onInsertAndUpdate - Optional callback triggered on INSERT and UPDATE events.
 * @param options.onPushToRemote - Optional callback triggered on INSERT and UPDATE events.
 * @param options.onDelete - Optional callback triggered on DELETE events.
 * @param options.limit - Optional limit for the number of records to fetch initially. Defaults to 200.
 * @param options.useFilterWhileSyncing - If true, uses the filter while syncing. Defaults to true.
 *
 * @returns
 * - `data`: Array of local data, memoized by version.
 * - `dataMap`: Map of data keyed by ID.
 * - `trigger`: Starts fetch and subscription (used with `lazy: true`).
 * - `cancel`: Cancels a pending fetch or blocks lazy init.
 */
export function useSupastashData(table, options = {}) {
    const { filter, lazy = false, flushIntervalMs = 100, shouldFetch = true, realtime = true, } = options;
    const initialized = useRef(false);
    const { dataMap, setDataMap, version, setVersion } = useDataState(table);
    const queueHandler = useEventQueues(table, setDataMap, setVersion, options, flushIntervalMs);
    const { triggerRefresh, trigger, cancel, initialFetchAndSync, pushToUI } = fetchCalls(table, setDataMap, setVersion, options, initialized);
    useEffect(() => {
        if (!shouldFetch || (lazy && !initialized.current))
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
            supastashEventBus.on(`push:${table}`, pushToUI);
            return () => {
                supastashEventBus.off?.(`refresh:${table}`, triggerRefresh);
                supastashEventBus.off?.(`refresh:all`, triggerRefresh);
                supastashEventBus.off?.(`push:${table}`, pushToUI);
                unsub.remove();
                unregisterSub(table, filter);
            };
        }
    }, [lazy, shouldFetch]);
    // TEMP: Remove this once we have a proper realtime subscription hook
    useRealtimeData(table, queueHandler, options, initialized.current, realtime);
    const data = useMemo(() => Array.from(dataMap.values()), [version]);
    return { data, dataMap, trigger, cancel };
}
