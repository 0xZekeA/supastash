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

export interface RealtimeOptions {
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
  data: R[];
  dataMap: Map<string, R>;
  trigger: () => void;
  cancel: () => void;
  // realtimeStatus: RealtimeStatus;
};

export type SupastashDataHook = (
  table: string,
  options: RealtimeOptions
) => SupastashDataResult;

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
