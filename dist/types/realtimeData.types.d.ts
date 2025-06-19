export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "in"
  | "is";

export type RealtimeFilter = {
  column: string;
  operator: FilterOperator;
  value: string | number | null | (string | number)[];
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
   * Whether to use the filter while syncing.
   * @default true
   *
   * @example
   * useFilterWhileSyncing: true
   */
  useFilterWhileSyncing?: boolean;

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
  filter?: RealtimeFilter;

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
  data: Array<R>;
  dataMap: Map<string, R>;
  trigger: () => void;
  cancel: () => void;
  groupedBy?: {
    [K in keyof R]: Map<R[K], Array<R>>;
  };
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
