import { LiteQueryOptions, LiteQueryResult } from "../../types/liteQuery.types";
/**
 * useSupastashLiteQuery
 *
 * A lightweight alternative to `useSupastashData` — purpose-built for local-first apps
 * that need precise control over data loading without the overhead of Supabase Realtime
 * or global caching mechanisms.
 *
 * 🧩 Key Differences from `useSupastashData`:
 *   - No realtime listeners or sync triggers
 *   - No global cache — only the queried data is held in memory
 *   - Manual refresh and pagination: nothing is loaded unless explicitly requested
 *
 * 🔍 Purpose:
 * Ideal for views where memory usage must be minimized and only essential data is required.
 * Perfect for infinite scrolls, segmented screens, or "lite mode" interfaces.
 *
 * ✅ Features:
 *   - Offset-based pagination with `loadMore`
 *   - SQL-compliant filtering and ordering
 *   - Implicit soft delete handling (`deleted_at IS NULL`)
 *   - Event-driven refresh support (`liteQueryRefresh:<table>`)
 *
 * ⚙️ Defaults:
 *   - pageSize: 50
 *   - orderBy: "created_at"
 *   - orderDesc: true
 *
 * ⚠️ Requirements:
 *   - Table must have a string-based `id` column
 *
 * @template R - The row type for the queried table
 * @param {string} table - SQLite table name
 * @param {LiteQueryOptions} options - Optional SQL filters, order, and page size
 *
 *
 * @example
 * const { data, loadMore, refresh } = useSupastashLiteQuery("orders", {
 *   sqlFilter: [{ column: "shop_id", operator: "eq", value: activeShopId }],
 * });
 *
 * <FlatList
 *   data={data}
 *   keyExtractor={(item) => item.id}
 *   renderItem={({ item }) => <OrderCard item={item} />}
 *   onRefresh={refresh}
 *   refreshing={isLoading}
 *   ListEmptyComponent={<NoOrders />}
 *   ListFooterComponent={hasMore && isLoading ? <LoadMoreButton loadMore={loadMore} /> : null}
 * />
//  */
export declare function useSupastashLiteQuery<R = any>(table: string, options?: LiteQueryOptions<R>): LiteQueryResult<R>;
//# sourceMappingURL=index.d.ts.map