export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "in"
  | "is";

export type Filter<R = any> = {
  column: keyof R;
  operator: FilterOperator;
  value: string | number | null | boolean | (string | number)[];
};

export type SupastashFilter<R = any> =
  | Filter<R>
  | {
      or: Filter<R>[];
    };

export interface RealtimeOptions<R = any> {
  /**
   * Whether to fetch local data automatically when the hook mounts.
   * @default true
   *
   * @example
   * const { user } = useAuth();
   * const { data } = useSupastashData("messages", {
   *   shouldFetch: !!user
   * });
   */
  shouldFetch?: boolean;

  /**
   * Optional list of keys used to store data in **alternate maps** instead of the default one.
   * Useful for indexing or grouping data under multiple identifiers (e.g., `["chat_id", "user_id"]`).
   *
   * When provided, each key will correspond to a separate map entry, allowing for multi-key access patterns.
   *
   * @default undefined
   *
   * @example
   * // Store messages in maps grouped by both chat ID and user ID
   * extraMapKeys: ["chat_id", "user_id"]
   */
  extraMapKeys?: (keyof R)[];

  /**
   * Fetches only records created within the last specified number of days.
   * Useful for limiting results to recent activity.
   *
   * @default undefined — fetches all records regardless of date
   *
   * @example
   * daylength: 7 // fetch records from the last 7 days
   */
  daylength?: number;

  /**
   * Whether to use the realtime filter while syncing.
   * @default true
   *
   * @example
   * useFilterWhileSyncing: true
   */
  useFilterWhileSyncing?: boolean;

  /**
   * Column to order results by.
   * Defaults to "created_at".
   *
   * @example
   * orderBy: "created_at"
   */
  orderBy?: keyof R;

  /**
   * Whether to sort in descending order.
   * Defaults to true.
   *
   * @example
   * orderDesc: true // newest first
   */
  orderDesc?: boolean;

  /**
   * Optional SQL WHERE filters.
   * These are applied directly to the query.
   *
   * @example
   * sqlFilter: [{ column: "user_id", operator: "eq", value: "123" }]
   */
  sqlFilter?: RealtimeFilter<R>[];

  /**
   * Clears the shared cache for this table when the hook mounts.
   * Use this **only if** you're sure no other component is using the same table
   * via this hook at the same time. Otherwise, clearing the cache will affect
   * those components too — potentially causing flickers, forced re-fetches,
   * or empty states.
   *
   *
   * @default false
   *
   * @example
   * clearCacheOnMount: true
   */
  clearCacheOnMount?: boolean;

  /**
   * Filter condition applied to the Supabase realtime subscription stream.
   *
   * @example
   * filter: {
   *   column: "user_id",
   *   operator: "eq",
   *   value: "123"
   * }
   */
  filter?: RealtimeFilter<R>;

  /**
   * If true, only use the filter for the realtime subscription stream.
   * Default is false, meaning the filter is applied to both the realtime subscription stream and the local database.
   *
   * Use `useSupastashFilters` to filter the data from the supabase.
   *
   * @example
   * onlyUseFilterForRealtime: true
   */
  onlyUseFilterForRealtime?: boolean;

  /**
   * Maximum number of records to fetch initially from the local database.
   * @default 1000
   *
   * @example
   * limit: 400
   */
  limit?: number;

  /**
   * Called when a new record is inserted into the table.
   *
   * @example
   * onInsert: (payload) => {
   *   console.log("Inserted", payload);
   * }
   */
  onInsert?: (payload: any) => void;

  /**
   * Called when an existing record is updated.
   *
   * @example
   * onUpdate: (payload) => {
   *   console.log("Updated", payload);
   * }
   */
  onUpdate?: (payload: any) => void;

  /**
   * Called when a record is deleted.
   *
   * @example
   * onDelete: (payload) => {
   *   console.log("Deleted", payload);
   * }
   */
  onDelete?: (payload: any) => void;

  /**
   * Called on both insert and update events.
   * Useful when insert/update are handled the same way.
   *
   * @example
   * onInsertAndUpdate: async (payload) => {
   *   const { data: localMessage } = await supastash
   *     .from("messages")
   *     .select("*")
   *     .eq("id", payload.id)
   *     .run();
   *
   *   if (!localMessage || localMessage.is_received) return;
   *
   *   await supastash
   *     .from("messages")
   *     .upsert({ ...localMessage, is_received: true })
   *     .run();
   * }
   */
  onInsertAndUpdate?: (payload: any) => Promise<void>;

  /**
   * Called to push unsynced local records to the remote database.
   * Must return `true` if push was successful; otherwise, it will be retried later.
   *
   * @example
   * onPushToRemote: async (payload) => {
   *   const result = await supabase.from("messages").upsert(payload);
   *   return !result.error;
   * }
   */
  onPushToRemote?: (payload: any[]) => Promise<boolean>;

  /**
   * Whether to use realtime subscription.
   * @default true
   *
   * @example
   * realtime: true
   */
  realtime?: boolean;

  /**
   * If true, delays the initial fetch until `trigger()` is manually called.
   *
   * @example
   * lazy: true
   *
   * const { data, trigger } = useSupastashData("messages", { lazy: true });
   *
   * useEffect(() => {
   *   if (loaded) trigger();
   * }, []);
   */
  lazy?: boolean;

  /**
   * Interval in milliseconds to batch UI updates for performance.
   * @default 100
   *
   * @example
   * flushIntervalMs: 200
   */
  flushIntervalMs?: number;
}

export type SupastashDataResult<R = any> = {
  /**
   * Array of records.
   * @example
   * data: [user1, user2],
   */
  data: Array<R>;
  /**
   * Map of records by ID.
   * @example
   * dataMap: new Map([[1, user1], [2, user2]]),
   */
  dataMap: Map<string, R>;
  /**
   * Trigger the fetch or sync.
   */
  trigger: () => void;
  /**
   * Cancel the pending fetch or sync.
   */
  cancel: () => void;
  /**
   * Optional maps grouped by field.
   * @example
   * groupedBy: {
   *   userId: new Map([[1, [user1, user2]]]),
   *   groupId: new Map([[1, [group1, group2]]]),
   * }
   */
  groupedBy?: {
    [K in keyof R]: Map<R[K], Array<R>>;
  };
  /**
   * Whether the data is being fetched.
   * @example
   * isFetching: true
   */
  isFetching: boolean;
};

export type SupastashDataHook<R = any> = (
  table: string,
  options: RealtimeOptions
) => SupastashDataResult<R>;

// Realtime manager types
export type EventHandler = (eventType: string, data: any) => void;
export type SubscriptionKey = string;
export type HookId = string;

export interface TableSubscription {
  table: string;
  filterString?: string;
  handlers: Map<HookId, EventHandler>;
  isActive: boolean;
}

export interface RealtimeStatus {
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  isNetworkConnected: boolean;
}

export type TableSchema = {
  column_name: string;
  data_type: string;
  is_nullable: string;
};
