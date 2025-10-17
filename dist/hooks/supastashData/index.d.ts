import { RealtimeOptions, SupastashDataResult } from "../../types/realtimeData.types";
/**
 * @description
 * React hook to sync and subscribe to local-first data from a Supabase table using Supastash.
 *
 * Use `useSupastashData` when you want:
 * - Offline-first reads from local SQLite.
 * - Optional realtime syncing via Supabase `postgres_changes`.
 * - Batching, lazy loading, and event-driven updates.
 *
 * @example
 * ```tsx
 * const { data, dataMap, trigger, cancel } = useSupastashData("users", {
 *   shouldFetch: !!session?.user,
 *   lazy: true,
 *   limit: 100,
 *   orderBy: "created_at",
 *   orderDesc: true,
 *   sqlFilter: [
 *     { column: "user_id", operator: "eq", value: 1 },
 *     { column: "is_active", operator: "eq", value: true },
 *   ],
 *   onInsert: (user) => console.log("New user:", user),
 * });
 *
 * useEffect(() => {
 *   trigger(); // Manually start sync
 * }, []);
 * ```
 *
 * @param table - Name of the table (must match local SQLite schema).
 * @param options - Configuration object.
 *
 * ## Fetch Options
 * @param options.shouldFetch - If false, disables initial fetch. Defaults to `true`.
 * @param options.lazy - If true, skips auto-fetch. Call `trigger()` manually.
 * @param options.limit - Max records to load. Defaults to `200`.
 * @param options.orderBy - Column to sort by. Defaults to `"created_at"`.
 * @param options.orderDesc - If true, sorts descending. Defaults to `true`.
 * @param options.sqlFilter - Optional SQL-level filters (`WHERE` clause).
 * @param options.useFilterWhileSyncing - Applies filter during sync. Defaults to `true`.
 * @param options.extraMapKey - Additional field to group `dataMap` by.
 * @param options.clearCacheOnMount - Clears in-memory cache on mount. Defaults to `false`.
 *
 * ## Realtime Options
 * @param options.realtime - Enables Supabase `postgres_changes` subscription. Defaults to `true`.
 * @param options.filter - Realtime filter (column/operator/value).
 * @param options.flushIntervalMs - Flush interval (in ms) for UI updates. Defaults to `100`.
 *
 * ## Event Callbacks
 * @param options.onInsert - Called on `INSERT` event.
 * @param options.onUpdate - Called on `UPDATE` event.
 * @param options.onDelete - Called on `DELETE` event.
 * @param options.onInsertAndUpdate - Called on both `INSERT` and `UPDATE`.
 * @param options.onPushToRemote - Called after pushing a local change to Supabase.
 *
 * @returns {
 *   data: Array of records,
 *   dataMap: Map of records by ID,
 *   groupedBy: Optional maps grouped by field,
 *   trigger: Manually trigger sync,
 *   cancel: Cancel pending fetch or
 *   isFetching: Whether the data is being fetched
 * }
 */
export declare function useSupastashData<R = any>(table: string, options?: RealtimeOptions): SupastashDataResult<R>;
//# sourceMappingURL=index.d.ts.map