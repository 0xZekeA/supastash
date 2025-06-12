import { CrudMethods, SupastashQuery } from "../../../types/query.types";
import SupastashCrudBuilder from "./crud";
/**
 * Builder for the supastash query
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export declare class SupastashQueryBuilder<T extends CrudMethods, U extends boolean, R> {
    private readonly query;
    /**
     * Constructor for the supastash query builder
     * @param query - The query to build
     */
    constructor(query: SupastashQuery<T, U, R>);
    /**
     * Sets the table to query.
     *
     * @param table - The table to query.
     * @returns crud options.
     */
    from(table: string): SupastashCrudBuilder<T, U, R>;
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
export declare const supastash: SupastashQueryBuilder<CrudMethods, boolean, any>;
//# sourceMappingURL=index.d.ts.map