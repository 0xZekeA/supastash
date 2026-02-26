// NOT READY FOR USE YET

import { useCallback, useMemo, useRef, useState } from "react";
import { getSupastashDb } from "../../db/dbInitializer";
import { LiteQueryOptions, LiteQueryResult } from "../../types/liteQuery.types";
import { SupastashFilter } from "../../types/realtimeData.types";
import { SupastashSQLiteDatabase } from "../../types/supastashConfig.types";
import {
  buildFilters,
  sanitizeOrderBy,
  sanitizeTableName,
} from "../../utils/fetchData/liteHelpers";
import { logError } from "../../utils/logs";
import { isTrulyNullish } from "../../utils/serializer";

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
export function useSupastashLiteQuery<R = any>(
  table: string,
  options: LiteQueryOptions<R> = {}
): LiteQueryResult<R> {
  const [data, setData] = useState<R[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const dbRef = useRef<SupastashSQLiteDatabase | null>(null);

  const loadMore = useCallback(
    async (isRefresh = false) => {
      if (loading) return;

      if (!dbRef.current) {
        dbRef.current = await getSupastashDb();
      }

      const db = dbRef.current;

      setLoading(true);

      try {
        const amount = (page + 1) * (options.pageSize ?? 50);

        const sanitizedTable = sanitizeTableName(table);
        const sanitizedOrderBy = sanitizeOrderBy(
          options.orderBy ?? "created_at"
        );

        const limit = options.pageSize ?? 50;
        const orderDirection = options.orderDesc === false ? "ASC" : "DESC";

        const filters = await buildFilters(
          options.sqlFilter ?? [],
          sanitizedTable,
          true
        );

        const query = `
        SELECT * FROM ${sanitizedTable}
        WHERE deleted_at IS NULL${filters}
        ORDER BY ${sanitizedOrderBy} ${orderDirection}
        LIMIT ${amount};
      `;

        const rows = await db.getAllAsync(query);

        if (rows && rows.length > 0) {
          setData(rows);
          setPage((prev) => (isRefresh ? prev : prev + 1));
          setHasMore(rows.length === limit);
        }
      } catch (error) {
        logError(error);
      } finally {
        setLoading(false);
      }
    },
    [
      table,
      options.pageSize,
      options.orderBy,
      options.orderDesc,
      options.sqlFilter,
    ]
  );

  const reset = useCallback(() => {
    setPage(0);
    setHasMore(true);
    setLoading(false);
    setData([]);
    loadMore();
  }, [loadMore]);

  const isAnyNullish = useMemo(() => {
    if (!options.sqlFilter?.length) return false;

    const check = (filter: SupastashFilter): boolean => {
      if (!filter || typeof filter !== "object") return false;

      if ("or" in filter) {
        return filter.or?.some(check) ?? false;
      } else {
        return isTrulyNullish(filter.value) && filter.operator !== "is";
      }
    };

    return options.sqlFilter.some(check);
  }, [options.sqlFilter]);

  return { data, loadMore, loading, hasMore, reset };
}
