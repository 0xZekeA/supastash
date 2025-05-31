import { RealtimeOptions } from "@/types/realtimeData.types";
import { eventBus } from "@/utils/events/eventBus";
import { buildFilterString } from "@/utils/fetchData/buildFilter";
import { fetchLocalData } from "@/utils/fetchData/fetchLocalData";
import log from "@/utils/logs";
import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import useDataState from "./dataState";
import useEventQueues from "./eventQueues";
import useRealtimeSubscription from "./realtimeSubscription";

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
 * const { data, dataMap, trigger, cancel } = useSupatashData("users", {
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
 * @param options.rawFilter - Optional raw filter string (used if `filter` is not provided).
 * @param options.flushIntervalMs - Interval in ms to flush batched changes into state. Defaults to 100ms.
 * @param options.lazy - If true, disables auto-fetch. Use `trigger()` to manually start.
 * @param options.onInsert - Optional callback triggered on INSERT events.
 * @param options.onUpdate - Optional callback triggered on UPDATE events.
 * @param options.onDelete - Optional callback triggered on DELETE events.
 *
 * @returns
 * - `data`: Array of local data, memoized by version.
 * - `dataMap`: Map of data keyed by ID.
 * - `trigger`: Starts fetch and subscription (used with `lazy: true`).
 * - `cancel`: Cancels a pending fetch or blocks lazy init.
 */

export default function useSupatashData(
  table: string,
  options: RealtimeOptions = {}
) {
  const {
    shouldFetch = true,
    filter,
    rawFilter,
    lazy = false,
    flushIntervalMs = 100,
  } = options;

  const initialized = useRef(false);
  const cancelled = useRef(false);

  const { dataMap, setDataMap, version, setVersion } = useDataState();

  const fetch = async () => {
    if (!cancelled.current)
      await fetchLocalData(table, setDataMap, setVersion, shouldFetch);
  };

  const trigger = () => {
    if (!initialized.current) {
      initialized.current = true;
      cancelled.current = false;
      fetch();
    }
  };

  const cancel = () => {
    cancelled.current = true;
  };

  const triggerRefresh = () => {
    log(`🔁 Refreshing data for ${table}`);
    fetch();
  };

  const queueHandler = useEventQueues(
    table,
    setDataMap,
    setVersion,
    options,
    flushIntervalMs
  );

  const filterString =
    buildFilterString(filter || []) || rawFilter || undefined;
  useEffect(() => {
    if (lazy && !initialized.current) return;
    const unsub = AppState.addEventListener("change", (state: string) => {
      if (state === "active") triggerRefresh();
    });
    eventBus.on(`refresh:${table}`, triggerRefresh);
    return () => {
      eventBus.off?.(`refresh:${table}`, triggerRefresh);
      if (typeof fetchLocalData.cancel === "function") fetchLocalData.cancel();
      unsub.remove();
    };
  }, [lazy]);

  useRealtimeSubscription(
    table,
    filterString,
    queueHandler,
    options,
    initialized.current
  );

  const data = useMemo(() => Array.from(dataMap.values()), [version]);
  return { data, dataMap, trigger, cancel };
}
