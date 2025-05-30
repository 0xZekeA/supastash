import {
  CrudMethods,
  ExecuteOptions,
  SupastashQuery,
  SupastashQueryResult,
  SyncMode,
} from "@/types/query.types";
import { eventBus } from "@/utils/events/eventBus";
import { querySupabase } from "../remoteQuery/supabaseQuery";
import { queryDb } from "./mainQuery";

/**
 * Builder for the filter methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupaStashFilterBuilder<
  T extends CrudMethods,
  U extends boolean
> {
  /**
   * Constructor for the filter builder
   * @param query - The query to build
   */
  constructor(
    private readonly query: SupastashQuery & { isSingle: U; method: T }
  ) {}

  /**
   * Sets the EQ operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  eq(column: string, value: any) {
    this.query.filters?.push({ column, operator: "=", value });
    return this;
  }

  /**
   * Sets the NEQ operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  neq(column: string, value: any) {
    this.query.filters?.push({ column, operator: "!=", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the GT operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  gt(column: string, value: any) {
    this.query.filters?.push({ column, operator: ">", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the LT operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  lt(column: string, value: any) {
    this.query.filters?.push({ column, operator: "<", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the GTE operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  gte(column: string, value: any) {
    this.query.filters?.push({ column, operator: ">=", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the LTE operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  lte(column: string, value: any) {
    this.query.filters?.push({ column, operator: "<=", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the LIKE operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  like(column: string, value: any) {
    this.query.filters?.push({ column, operator: "LIKE", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the IS operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  is(column: string, value: any) {
    this.query.filters?.push({ column, operator: "IS", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the IN operator for the query.
   *
   * @param column - The column to filter by.
   * @param value - The value to filter by.
   * @returns more filter options.
   */
  in(column: string, value: any[]) {
    this.query.filters?.push({ column, operator: "IN", value });
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Sets the limit of the query.
   *
   * @param n - The number of results to return.
   * @returns more filter options.
   */
  limit(n: number) {
    this.query.limit = n;
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Returns only one result instead of an array.
   * Sets `limit(1)` automatically. Fails if more than one result is returned.
   *
   * Similar to Supabase `.single()`.
   */
  single() {
    this.query.isSingle = true as U;
    this.query.limit = 1;
    return new SupaStashFilterBuilder<T, true>(
      this.query as SupastashQuery & { isSingle: true; method: T }
    );
  }

  /**
   * Sets the sync mode of the query.
   *
   * @param mode - The sync mode to use.
   * @returns more filter options.
   */
  syncMode(mode: SyncMode) {
    this.query.type = mode;
    return new SupaStashFilterBuilder(this.query);
  }

  /**
   * Executes the query.
   * Must be called after all filters are set.
   *
   * @returns The query result.
   */
  execute(options?: ExecuteOptions): Promise<SupastashQueryResult<T, U>> {
    const maxRetries = options?.remoteRetry ?? 0;
    const delay = options?.remoteRetryDelay ?? 500;

    if (options?.debug) {
      console.debug("[Supastash] Executing query with state:", this.query);
    }

    const attemptQuery = async (): Promise<SupastashQueryResult<T, U>> => {
      const result = await queryDb<T, U>(
        this.query as any as SupastashQuery & { isSingle: U; method: T }
      );
      if (this.query.method !== "select" && this.query.method !== "none") {
        eventBus.emit(`refresh:${this.query.table}`);
      }

      if (!result.remote?.error || maxRetries === 0) {
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

        const remoteResult = await querySupabase(
          this.query as any as SupastashQuery & { isSingle: U; method: T }
        );
        result.remote = remoteResult;

        if (!remoteResult?.error) break;
      }

      return result;
    };

    if (!this.query.method || this.query.method === "none") {
      return Promise.reject(new Error("No method selected"));
    }

    return attemptQuery() as unknown as Promise<SupastashQueryResult<T, U>>;
  }

  /**
   * Alias for `execute()`.
   *
   * @returns The query result.
   */
  run() {
    return this.execute();
  }

  /**
   * Alias for `execute()`.
   *
   * @returns The query result.
   */
  go() {
    return this.execute();
  }
}
