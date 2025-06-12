import { generateUUIDv4 } from "../../genUUID";
import SupastashCrudBuilder from "./crud";
/**
 * Builder for the supastash query
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export class SupastashQueryBuilder {
    /**
     * Constructor for the supastash query builder
     * @param query - The query to build
     */
    constructor(query) {
        this.query = query;
    }
    /**
     * Sets the table to query.
     *
     * @param table - The table to query.
     * @returns crud options.
     */
    from(table) {
        const newQuery = { ...this.query, table };
        return new SupastashCrudBuilder(newQuery);
    }
}
/**
 * Supastash query builder for local-first CRUD operations.
 *
 * This builder allows you to construct and execute queries against a local SQLite store
 * with optional synchronization to Supabase.
 *
 * Notes:
 * - SELECT operations return local data by default unless `sync mode` is set to "remoteOnly".
 * - `.run()` (alias of `.execute()`) is **required** to finalize and perform the query.
 * - Use `.run({ viewRemoteResult: true })` to view the remote result from Supabase.
 * - All operations except DELETE return local data automatically — no need to chain `.select()`.
 *
 * @returns A chainable Supastash query instance.
 *
 * @example
 * const result = await supastash
 *   .from("users")
 *   .update({ name: "John Doe" })
 *   .eq("id", "1")
 *   .run(); // Required to execute the query
 */
export const supastash = new SupastashQueryBuilder({
    id: generateUUIDv4(),
    table: "",
    method: "none",
    payload: null,
    filters: [],
    limit: null,
    select: null,
    isSingle: false,
    type: "localFirst",
    runSelected: false,
    viewRemoteResult: false,
});
