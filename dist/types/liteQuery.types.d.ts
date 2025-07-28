import { RealtimeFilter } from "./realtimeData.types";

/**
 * LiteQueryOptions
 *
 * Configuration options for `useSupastashLiteQuery`.
 * These control pagination, sorting, and row-level filtering of local SQLite data.
 *
 * Defaults:
 * - pageSize: 50
 * - orderBy: "created_at"
 * - orderDesc: true
 */
export type LiteQueryOptions<R = any> = {
  /**
   * Number of rows to fetch per page.
   * Defaults to 50 if not provided.
   */
  pageSize?: number;

  /**
   * Column used to sort the data.
   * Defaults to "created_at".
   * Must exist on the table, or query will fail.
   */
  orderBy?: string;

  /**
   * Whether to sort in descending order.
   * Defaults to true.
   */
  orderDesc?: boolean;

  /**
   * Optional SQL-level filters applied at query time.
   * Used to scope the local query using column-level filters.
   *
   * Example:
   * [
   *   {
   *     column: "user_id",
   *     operator: "eq",
   *     value: "123"
   *   }
   * ]
   */
  sqlFilter?: RealtimeFilter<R>[];
};

export interface LiteQueryResult<R> {
  data: R[];
  hasMore: boolean;
  loading: boolean;
  reset: () => void;
  loadMore: () => Promise<void>;
}
