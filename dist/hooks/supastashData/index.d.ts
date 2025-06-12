import { RealtimeOptions, SupastashDataResult } from "../../types/realtimeData.types";
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
export declare function useSupastashData<R = any>(table: string, options?: RealtimeOptions): SupastashDataResult<R>;
//# sourceMappingURL=index.d.ts.map