import { useEffect, useRef } from "react";
import { syncCalls } from "../../store/syncCalls";
import { tableFilters } from "../../store/tableFilters";
import { RealtimeOptions } from "../../types/realtimeData.types";
import { fetchLocalData } from "../../utils/fetchData/fetchLocalData";
import { initialFetch } from "../../utils/fetchData/initialFetch";
import log from "../../utils/logs";

const timesFetched = new Map<string, number>();
let lastFetched = new Map<string, number>();

export function fetchCalls<R>(
  table: string,
  options: RealtimeOptions<R>,
  initialized: React.RefObject<boolean>
) {
  const {
    shouldFetch = true,
    limit,
    filter,
    onPushToRemote,
    onInsertAndUpdate,
    useFilterWhileSyncing = true,
    extraMapKeys,
    daylength,
  } = options;
  const cancelled = useRef(false);

  useEffect(() => {
    if (filter && useFilterWhileSyncing && !tableFilters.get(table)) {
      tableFilters.set(table, filter);
    }
    if (onPushToRemote) {
      syncCalls.set(table, {
        ...(syncCalls.get(table) || {}),
        push: onPushToRemote,
      });
    }
    if (onInsertAndUpdate) {
      syncCalls.set(table, {
        ...(syncCalls.get(table) || {}),
        pull: onInsertAndUpdate,
      });
    }
  }, []);

  const fetch = async () => {
    if (!cancelled.current) {
      await fetchLocalData(table, shouldFetch, limit, extraMapKeys, daylength);
    }
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

  const triggerRefresh = async () => {
    timesFetched.set(table, (timesFetched.get(table) || 0) + 1);

    if ((timesFetched.get(table) || 0) >= 5) {
      const timeSinceLastFetch = Date.now() - (lastFetched.get(table) || 0);
      lastFetched.set(table, Date.now());
      log(
        `🔁 Refreshing data for ${table} (times fetched: ${timesFetched.get(
          table
        )} in the last ${timeSinceLastFetch}ms`
      );
      timesFetched.set(table, 0);
    }
    await fetch();
  };

  const initialFetchAndSync = async () => {
    if (!shouldFetch || cancelled.current) return;
    try {
      await initialFetch(table, filter, onInsertAndUpdate, onPushToRemote);
      await fetch();
    } catch (error) {
      console.error(`[Supastash] Error on initial fetch for ${table}`, error);
    }
  };

  return {
    triggerRefresh,
    trigger,
    cancel,
    initialFetchAndSync,
  };
}
