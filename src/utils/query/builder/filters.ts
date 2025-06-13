import {
  CrudMethods,
  ExecuteOptions,
  FilterCalls,
  SupastashQuery,
  SupastashQueryResult,
  SyncMode,
} from "../../../types/query.types";
import { querySupabase } from "../remoteQuery/supabaseQuery";
import { queryDb } from "./mainQuery";

/**
 * Builder for the filter methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupastashFilterBuilder<
  T extends CrudMethods,
  U extends boolean,
  R,
  Z
> {
  /**
   * Builds a new query with the given filter.
   * @param filter - The filter to add to the query.
   * @returns A new query builder.
   */
  private build<M extends T>(
    filter: FilterCalls
  ): SupastashFilterBuilder<M, U, R, Z> {
    return new SupastashFilterBuilder<M, U, R, Z>({
      ...(this.query as SupastashQuery<M, U, R>),
      filters: [
        ...((this.query as SupastashQuery<M, U, R>).filters || []),
        filter,
      ],
    });
  }

  /**
   * Builds a new query with the given patch.
   * @param patch - The patch to add to the query.
   * @returns A new query builder.
   */
  private withQueryPatch<M extends T, NewU extends U = U>(
    patch: Partial<SupastashQuery<M, NewU, R>>
  ): SupastashFilterBuilder<M, NewU, R, Z> {
    return new SupastashFilterBuilder<M, NewU, R, Z>({
      ...(this.query as SupastashQuery<M, NewU, R>),
      ...patch,
    });
  }

  /**
   * Constructor for the filter builder
   * @param query - The query to build
   */
  constructor(private readonly query: SupastashQuery<T, U, R>) {}

  /**
   * Sets the EQ operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  eq(column: string, value: any) {
    return this.build<T>({ column, operator: "=" as const, value });
  }

  /**
   * Sets the NEQ operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  neq(column: string, value: any) {
    return this.build<T>({ column, operator: "!=" as const, value });
  }

  /**
   * Sets the GT operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  gt(column: string, value: any) {
    return this.build<T>({ column, operator: ">" as const, value });
  }

  /**
   * Sets the LT operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  lt(column: string, value: any) {
    return this.build<T>({ column, operator: "<" as const, value });
  }

  /**
   * Sets the GTE operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  gte(column: string, value: any) {
    return this.build<T>({ column, operator: ">=" as const, value });
  }

  /**
   * Sets the LTE operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  lte(column: string, value: any) {
    return this.build<T>({ column, operator: "<=" as const, value });
  }

  /**
   * Sets the LIKE operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  like(column: string, value: any) {
    return this.build<T>({ column, operator: "LIKE" as const, value });
  }

  /**
   * Sets the IS operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  is(column: string, value: any) {
    return this.build<T>({ column, operator: "IS" as const, value });
  }

  /**
   * Sets the IN operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  in(column: string, value: any[]) {
    return this.build<T>({ column, operator: "IN" as const, value });
  }

  /**
   * Sets the limit of the query.
   *
   * @param n - The number of results to return.
   * @returns more filter options.
   */
  limit(n: number) {
    return this.withQueryPatch<T>({ limit: n });
  }

  /**
   * Returns only one result instead of an array.
   * Sets `limit(1)` automatically. Fails if more than one result is returned.
   *
   * Similar to Supabase `.single()`.
   */
  single() {
    return new SupastashFilterBuilder<T, true, R, Z>({
      ...this.query,
      isSingle: true,
      limit: 1,
    });
  }

  /**
   * Sets the sync mode of the query.
   *
   * @param mode - The sync mode to use.
   * @returns more filter options.
   */
  syncMode(mode: SyncMode) {
    return this.withQueryPatch<T>({ type: mode });
  }

  /**
   * Executes the query.
   * Must be called after all filters are set.
   *
   * @returns The query result.
   */
  execute<V extends boolean = false>(
    options?: ExecuteOptions & { viewRemoteResult?: V }
  ): Promise<SupastashQueryResult<T, U, V, Z>> {
    const newQuery = {
      ...this.query,
      viewRemoteResult: options?.viewRemoteResult ?? false,
    };

    const maxRetries = options?.remoteRetry ?? 0;
    const delay = options?.remoteRetryDelay ?? 500;

    if (options?.debug) {
      console.debug("[Supastash] Executing query with state:", newQuery);
    }

    const attemptQuery = async (): Promise<
      SupastashQueryResult<T, U, V, Z>
    > => {
      const result = await queryDb<T, U, V, R, Z>(
        newQuery as SupastashQuery<T, U, R> & { viewRemoteResult: V }
      );

      if (!options?.viewRemoteResult) return result;

      if (
        options?.viewRemoteResult
          ? ("remote" in result && !result.remote?.error) || maxRetries === 0
          : ("error" in result && !result.error) || maxRetries === 0
      ) {
        return result;
      }

      for (let i = 1; i <= maxRetries; i++) {
        const delayMs = delay * Math.pow(2, i - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        if (options?.debug) {
          console.debug(
            `[Supastash] Retry ${i}/${maxRetries} after ${delayMs}ms...`
          );
        }

        const remoteResult = await querySupabase<U, R, Z>(
          newQuery as SupastashQuery<T, U, R>
        );
        if (newQuery.viewRemoteResult && "remote" in result) {
          result.remote = remoteResult;
        }

        if (!remoteResult?.error) break;
      }

      return result;
    };

    if (!newQuery.method || newQuery.method === "none") {
      return Promise.reject(new Error("No method selected"));
    }

    return attemptQuery() as unknown as Promise<
      SupastashQueryResult<T, U, V, Z>
    >;
  }

  /**
   * Alias for `execute()`.
   *
   * @returns The query result.
   */
  run<V extends boolean = false>(
    options?: ExecuteOptions & { viewRemoteResult?: V }
  ) {
    return this.execute(options);
  }

  /**
   * Alias for `execute()`.
   *
   * @returns The query result.
   */
  go<V extends boolean = false>(
    options?: ExecuteOptions & { viewRemoteResult?: V }
  ) {
    return this.execute(options);
  }
}
