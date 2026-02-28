import { CrudMethods, ExecuteOptions, SupastashQuery, SupastashQueryResult, SyncMode } from "../../../types/query.types";
type FilterBuilderFor<T extends CrudMethods, U extends boolean, R, Z> = T extends "select" ? SupastashFilterBuilder<T, U, R, Z> : Omit<SupastashFilterBuilder<T, U, R, Z>, "cacheFirst">;
/**
 * Builder for the filter methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupastashFilterBuilder<T extends CrudMethods, U extends boolean, R, Z> {
    private readonly query;
    /**
     * Builds a new query with the given filter.
     * @param filter - The filter to add to the query.
     * @returns A new query builder.
     */
    private build;
    /**
     * Builds a new query with the given patch.
     * @param patch - The patch to add to the query.
     * @returns A new query builder.
     */
    private withQueryPatch;
    /**
     * Constructor for the filter builder
     * @param query - The query to build
     */
    constructor(query: SupastashQuery<T, U, R>);
    /**
     * Sets the EQ operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    eq(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the NEQ operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    neq(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the GT operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    gt(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the LT operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    lt(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the GTE operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    gte(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the LTE operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    lte(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the LIKE operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    like(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the IS operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    is(column: string, value: any): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the IN operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    in(column: string, value: any[]): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the limit of the query.
     *
     * @param n - The number of results to return.
     * @returns more filter options.
     */
    limit(n: number): FilterBuilderFor<T, U, R, Z>;
    /**
     * Returns only one result instead of an array.
     * Sets `limit(1)` automatically. Fails if more than one result is returned.
     *
     * Similar to Supabase `.single()`.
     */
    single(): SupastashFilterBuilder<T, true, R, Z>;
    /**
     * Creates its own SQLite transaction for this insert or upsert.
     *
     * Do not use inside `db.withTransaction(...)` or
     * `supastash.withTransaction(...)` — nested transactions are not allowed.
     */
    withTx(): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the preserve timestamp of the query.
     *
     * @param preserve - Whether to preserve the timestamp.
     * @returns more filter options.
     */
    preserveTimestamp(preserve: boolean): FilterBuilderFor<T, U, R, Z>;
    /**
     * Sets the sync mode of the query.
     *
     * @param mode - The sync mode to use.
     * @returns more filter options.
     */
    syncMode(mode: SyncMode): FilterBuilderFor<T, U, R, Z>;
    /**
     * Throws an error if the query fails.
     *
     * @returns more filter options.
     */
    throwOnError(): FilterBuilderFor<T, U, R, Z>;
    /**
     * Executes a cache-first fetch strategy.
     *
     * Attempts to resolve the query from the local database.
     * Falls back to the remote database if no usable result is found.
     *
     * @returns Query results from local and/or remote sources.
     */
    cacheFirst(): FilterBuilderFor<T, U, R, Z>;
    /**
     * Executes the query.
     * Must be called after all filters are set.
     *
     * @returns The query result.
     */
    execute<V extends boolean = false>(options?: ExecuteOptions & {
        viewRemoteResult?: V;
    }): Promise<SupastashQueryResult<T, U, V, Z>>;
    /**
     * Alias for `execute()`.
     *
     * @returns The query result.
     */
    run<V extends boolean = false>(options?: ExecuteOptions & {
        viewRemoteResult?: V;
    }): Promise<SupastashQueryResult<T, U, V, Z>>;
    /**
     * Alias for `execute()`.
     *
     * @returns The query result.
     */
    go<V extends boolean = false>(options?: ExecuteOptions & {
        viewRemoteResult?: V;
    }): Promise<SupastashQueryResult<T, U, V, Z>>;
}
export {};
//# sourceMappingURL=filters.d.ts.map