import { useEffect, useRef } from "react";
import { syncCalls } from "../../store/syncCalls";
import { tableFilters, tableFiltersUsed } from "../../store/tableFilters";
import {
  RealtimeFilter,
  RealtimeOptions,
} from "../../types/realtimeData.types";
import { fetchLocalData } from "../../utils/fetchData/fetchLocalData";
import { initialFetch } from "../../utils/fetchData/initialFetch";
import { logError } from "../../utils/logs";

export function fetchCalls<R = any>(
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
    orderBy,
    orderDesc,
    sqlFilter,
  } = options;
  const cancelled = useRef(false);

  useEffect(() => {
    if (filter && useFilterWhileSyncing && !tableFiltersUsed.has(table)) {
      tableFilters.set(table, [filter]);
    }
    if (onPushToRemote && !syncCalls.get(table)?.push) {
      syncCalls.set(table, {
        ...(syncCalls.get(table) || {}),
        push: onPushToRemote,
      });
    }
    if (onInsertAndUpdate && !syncCalls.get(table)?.pull) {
      syncCalls.set(table, {
        ...(syncCalls.get(table) || {}),
        pull: onInsertAndUpdate,
      });
    }
  }, [filter]);

  const fetch = async () => {
    let filters: RealtimeFilter[] | undefined;

    if (sqlFilter) {
      filters = sqlFilter;
    } else if (tableFilters.has(table)) {
      filters = tableFilters.get(table);
    } else if (!onlyUseFilterForRealtime) {
      filters = filter ? [filter] : undefined;
    }
    if (!cancelled.current) {
      await fetchLocalData(
        table,
        shouldFetch,
        limit,
        extraMapKeys,
        daylength,
        filters,
        orderBy ?? "created_at",
        orderDesc ?? true
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

    let filters: RealtimeFilter[] | undefined;

    if (sqlFilter) {
      filters = sqlFilter;
    } else if (tableFilters.has(table)) {
      filters = tableFilters.get(table);
    } else if (!onlyUseFilterForRealtime) {
      filters = filter ? [filter] : undefined;
    }

    try {
      await initialFetch(table, filters, onInsertAndUpdate, onPushToRemote);
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
