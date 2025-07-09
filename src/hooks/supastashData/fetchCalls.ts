import { useEffect, useRef } from "react";
import { syncCalls } from "../../store/syncCalls";
import { tableFilters } from "../../store/tableFilters";
import { RealtimeOptions } from "../../types/realtimeData.types";
import { fetchLocalData } from "../../utils/fetchData/fetchLocalData";
import { initialFetch } from "../../utils/fetchData/initialFetch";
import { logError } from "../../utils/logs";

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
    onlyUseFilterForRealtime,
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
    return () => {
      tableFilters.delete(table);
    };
  }, []);

  const fetch = async () => {
    if (!cancelled.current) {
      await fetchLocalData(
        table,
        shouldFetch,
        limit,
        extraMapKeys,
        daylength,
        onlyUseFilterForRealtime ? undefined : filter
      );
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
    await fetch();
  };

  const initialFetchAndSync = async () => {
    if (!shouldFetch || cancelled.current) return;
    try {
      await initialFetch(table, filter, onInsertAndUpdate, onPushToRemote);
      await fetch();
    } catch (error) {
      logError(`[Supastash] Error on initial fetch for ${table}`, error);
    }
  };

  return {
    triggerRefresh,
    trigger,
    cancel,
    initialFetchAndSync,
  };
}
