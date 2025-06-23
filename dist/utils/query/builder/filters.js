import { querySupabase } from "../remoteQuery/supabaseQuery";
import { queryDb } from "./mainQuery";
/**
 * Builder for the filter methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupastashFilterBuilder {
    /**
     * Builds a new query with the given filter.
     * @param filter - The filter to add to the query.
     * @returns A new query builder.
     */
    build(filter) {
        return new SupastashFilterBuilder({
            ...this.query,
            filters: [
                ...(this.query.filters || []),
                filter,
            ],
        });
    }
    /**
     * Builds a new query with the given patch.
     * @param patch - The patch to add to the query.
     * @returns A new query builder.
     */
    withQueryPatch(patch) {
        return new SupastashFilterBuilder({
            ...this.query,
            ...patch,
        });
    }
    /**
     * Constructor for the filter builder
     * @param query - The query to build
     */
    constructor(query) {
        this.query = query;
    }
    /**
     * Sets the EQ operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    eq(column, value) {
        return this.build({ column, operator: "=", value });
    }
    /**
     * Sets the NEQ operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    neq(column, value) {
        return this.build({ column, operator: "!=", value });
    }
    /**
     * Sets the GT operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    gt(column, value) {
        return this.build({ column, operator: ">", value });
    }
    /**
     * Sets the LT operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    lt(column, value) {
        return this.build({ column, operator: "<", value });
    }
    /**
     * Sets the GTE operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    gte(column, value) {
        return this.build({ column, operator: ">=", value });
    }
    /**
     * Sets the LTE operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    lte(column, value) {
        return this.build({ column, operator: "<=", value });
    }
    /**
     * Sets the LIKE operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    like(column, value) {
        return this.build({ column, operator: "LIKE", value });
    }
    /**
     * Sets the IS operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    is(column, value) {
        return this.build({ column, operator: "IS", value });
    }
    /**
     * Sets the IN operator for the query.
     *
     * @param column - The column to filter by.
     * @param value - The value to filter by.
     * @returns more filter options.
     */
    in(column, value) {
        return this.build({ column, operator: "IN", value });
    }
    /**
     * Sets the limit of the query.
     *
     * @param n - The number of results to return.
     * @returns more filter options.
     */
    limit(n) {
        return this.withQueryPatch({ limit: n });
    }
    /**
     * Returns only one result instead of an array.
     * Sets `limit(1)` automatically. Fails if more than one result is returned.
     *
     * Similar to Supabase `.single()`.
     */
    single() {
        return new SupastashFilterBuilder({
            ...this.query,
            isSingle: true,
            limit: 1,
        });
    }
    /**
     * Sets the preserve timestamp of the query.
     *
     * @param preserve - Whether to preserve the timestamp.
     * @returns more filter options.
     */
    preserveTimestamp(preserve) {
        return this.withQueryPatch({ preserveTimestamp: preserve });
    }
    /**
     * Sets the sync mode of the query.
     *
     * @param mode - The sync mode to use.
     * @returns more filter options.
     */
    syncMode(mode) {
        return this.withQueryPatch({ type: mode });
    }
    /**
     * Executes the query.
     * Must be called after all filters are set.
     *
     * @returns The query result.
     */
    execute(options) {
        const newQuery = {
            ...this.query,
            viewRemoteResult: options?.viewRemoteResult ?? false,
        };
        const maxRetries = options?.remoteRetry ?? 0;
        const delay = options?.remoteRetryDelay ?? 500;
        if (options?.debug) {
            console.debug("[Supastash] Executing query with state:", newQuery);
        }
        const attemptQuery = async () => {
            const result = await queryDb(newQuery);
            if (!options?.viewRemoteResult)
                return result;
            if (options?.viewRemoteResult
                ? ("remote" in result && !result.remote?.error) || maxRetries === 0
                : ("error" in result && !result.error) || maxRetries === 0) {
                return result;
            }
            for (let i = 1; i <= maxRetries; i++) {
                const delayMs = delay * Math.pow(2, i - 1);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                if (options?.debug) {
                    console.debug(`[Supastash] Retry ${i}/${maxRetries} after ${delayMs}ms...`);
                }
                const remoteResult = await querySupabase(newQuery);
                if (newQuery.viewRemoteResult && "remote" in result) {
                    result.remote = remoteResult;
                }
                if (!remoteResult?.error)
                    break;
            }
            return result;
        };
        if (!newQuery.method || newQuery.method === "none") {
            return Promise.reject(new Error("No method selected"));
        }
        return attemptQuery();
    }
    /**
     * Alias for `execute()`.
     *
     * @returns The query result.
     */
    run(options) {
        return this.execute(options);
    }
    /**
     * Alias for `execute()`.
     *
     * @returns The query result.
     */
    go(options) {
        return this.execute(options);
    }
}
