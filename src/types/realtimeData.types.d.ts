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
  shouldFetch?: boolean;
  filter?: FilterCalls[];
  rawFilter?: string;

  /** Called when an item is inserted, updated, or deleted */
  onInsert?: (payload: PayloadData) => void;
  onUpdate?: (payload: PayloadData) => void;
  onDelete?: (payload: PayloadData) => void;

  /** Lazy load: don't fetch until trigger() is called */
  lazy?: boolean;

  /** Milliseconds between batched UI updates (default 100ms) */
  flushIntervalMs?: number;
}
