// DEPRECATED: Use useRealtimeData instead

import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef } from "react";
import { getSupastashConfig } from "../../core/config";
import { PayloadData } from "../../types/query.types";
import {
  RealtimeOptions,
  RealtimeStatus,
} from "../../types/realtimeData.types";
import { buildFilterString } from "../../utils/fetchData/buildFilter";
import { RealtimeManager } from "../../utils/fetchData/realTimeManager";
import { supabaseClientErr } from "../../utils/supabaseClientErr";

const generateHookId = () => `hook_${Date.now()}_${Math.random().toString(36)}`;

function useRealtimeSubscription(
  table: string,
  queueHandler: (eventType: string, data: PayloadData) => void,
  options: RealtimeOptions,
  initialized: boolean,
  realtime: boolean
) {
  const supabase = getSupastashConfig().supabaseClient;
  const hookId = useRef<string>(generateHookId()).current;
  const realtimeStatusRef = useRef<RealtimeStatus>({
    status: "disconnected",
    isNetworkConnected: true,
  });
  const isSubscribedRef = useRef(false);
  const networkStateRef = useRef(true);

  const handleStatusChange = useCallback((status: string) => {
    realtimeStatusRef.current = {
      status: status as any,
      error: status === "error" ? "Connection failed" : undefined,
      isNetworkConnected: realtimeStatusRef.current.isNetworkConnected,
    };
  }, []);

  const handleNetworkChange = useCallback(
    (isConnected: boolean) => {
      const wasConnected = networkStateRef.current;
      networkStateRef.current = isConnected;

      realtimeStatusRef.current = {
        status: realtimeStatusRef.current.status,
        error: realtimeStatusRef.current.error,
        isNetworkConnected: isConnected,
      };

      if (wasConnected === isConnected) return;

      if (!isConnected) {
        if (isSubscribedRef.current) {
          const filterString = options.filter
            ? buildFilterString(options.filter)
            : undefined;
          RealtimeManager.unsubscribe(table, hookId, filterString);
          isSubscribedRef.current = false;
        }
      } else {
        const shouldSubscribe = !!(
          supabase &&
          options.shouldFetch &&
          realtime &&
          networkStateRef.current &&
          (!options.lazy || initialized)
        );
        if (shouldSubscribe && !isSubscribedRef.current) {
          const filterString = options.filter
            ? buildFilterString(options.filter)
            : undefined;
          RealtimeManager.subscribe(table, hookId, queueHandler, filterString);
          isSubscribedRef.current = true;
        }
      }
    },
    [table, hookId, options.filter]
  );

  useEffect(() => {
    if (!supabase) {
      console.error("[Supastash] No supabase client found", supabaseClientErr);
      return;
    }

    const filterString = options.filter
      ? buildFilterString(options.filter)
      : undefined;

    const unsubscribeStatus =
      RealtimeManager.onStatusChange(handleStatusChange);

    const unsubscribeNetInfo = NetInfo.addEventListener(({ isConnected }) => {
      handleNetworkChange(!!isConnected);
    });

    const shouldSubscribe = !!(
      supabase &&
      options.shouldFetch &&
      realtime &&
      networkStateRef.current &&
      (!options.lazy || initialized)
    );

    if (shouldSubscribe && !isSubscribedRef.current) {
      RealtimeManager.subscribe(table, hookId, queueHandler, filterString);
      isSubscribedRef.current = true;
    } else if (!shouldSubscribe && isSubscribedRef.current) {
      RealtimeManager.unsubscribe(table, hookId, filterString);
      isSubscribedRef.current = false;
    }

    return () => {
      unsubscribeStatus();
      unsubscribeNetInfo();

      if (isSubscribedRef.current) {
        RealtimeManager.unsubscribe(table, hookId, filterString);
        isSubscribedRef.current = false;
      }
    };
  }, [supabase, table, options.lazy, options.filter, options.shouldFetch]);

  return realtimeStatusRef.current;
}

export default useRealtimeSubscription;
