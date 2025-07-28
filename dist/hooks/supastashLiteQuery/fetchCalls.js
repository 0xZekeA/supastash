"use strict";
// import { useCallback, useMemo, useRef } from "react";
// import {
//   FetchAction,
//   LiteFetchState,
//   LiteQueryOptions,
// } from "../../types/liteQuery.types";
// import { fetchData } from "../../utils/fetchData/liteHelpers";
// export function useFetchCalls<R = any>(
//   table: string,
//   options: LiteQueryOptions<R>,
//   state: LiteFetchState<R>,
//   dispatch: React.Dispatch<FetchAction<R>>
// ) {
//   const requestIdRef = useRef(0);
//   const abortControllerRef = useRef<AbortController | null>(null);
//   const stableOptions = useMemo(
//     () => ({
//       pageSize: options.pageSize ?? 50,
//       orderBy: options.orderBy ?? "created_at",
//       orderDesc: options.orderDesc !== false,
//       sqlFilter: options.sqlFilter ?? [],
//       extraMapKeys: options.extraMapKeys ?? [],
//       enableCursor: options.enableCursor !== false,
//       staleTime: options.staleTime ?? 30000,
//     }),
//     [
//       options.pageSize,
//       options.orderBy,
//       options.orderDesc,
//       JSON.stringify(options.sqlFilter),
//       JSON.stringify(options.extraMapKeys),
//       options.enableCursor,
//       options.staleTime,
//     ]
//   );
//   const executeRequest = useCallback(
//     async (isLoadMore = false, isRefresh = false) => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//       if (isLoadMore && (!state.hasMore || state.isLoadingMore)) {
//         return;
//       }
//       if (state.isLoading || state.isRefreshing) {
//         return;
//       }
//       const currentRequestId = ++requestIdRef.current;
//       abortControllerRef.current = new AbortController();
//       dispatch({
//         type: "LOAD_START",
//         isRefresh,
//         isLoadMore,
//       });
//       try {
//         const result = await fetchData({
//           table,
//           options: stableOptions,
//           state,
//           isLoadMore,
//           isRefresh,
//         });
//         if (currentRequestId !== requestIdRef.current) {
//           return;
//         }
//         if (!result) {
//           dispatch({
//             type: "LOAD_SUCCESS",
//             payload: {
//               data: state.data,
//               dataMap: state.dataMap,
//               groupedBy: state.groupedBy,
//               hasMore: state.hasMore,
//               cursor: state.cursor,
//             },
//           });
//           return;
//         }
//         if (isRefresh) {
//           dispatch({ type: "REFRESH_SUCCESS", payload: result });
//         } else if (isLoadMore) {
//           dispatch({ type: "LOAD_MORE_SUCCESS", payload: result });
//         } else {
//           dispatch({ type: "LOAD_SUCCESS", payload: result });
//         }
//       } catch (error: any) {
//         if (currentRequestId === requestIdRef.current) {
//           dispatch({
//             type: "LOAD_ERROR",
//             error: error?.message || "Failed to fetch data",
//           });
//         }
//       } finally {
//         abortControllerRef.current = null;
//       }
//     },
//     [table, stableOptions, state]
//   );
//   const loadMore = useCallback(
//     () => executeRequest(true, false),
//     [executeRequest]
//   );
//   const refresh = useCallback(
//     () => executeRequest(false, true),
//     [executeRequest]
//   );
//   const loadInitial = useCallback(
//     () => executeRequest(false, false),
//     [executeRequest]
//   );
//   const cleanup = useCallback(() => {
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }
//   }, []);
//   return {
//     loadMore,
//     refresh,
//     loadInitial,
//     cleanup,
//   };
// }
