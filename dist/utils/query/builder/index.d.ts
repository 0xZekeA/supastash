import { CrudMethods, PayloadData, SupastashQuery } from "../../../types/query.types";
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
    /**
     * Executes multiple Supastash operations inside a single SQLite transaction.
     *
     * ⚠️ Do NOT call this inside `db.withTransaction(...)`
     *  or another `supastash.withTransaction(...)`.
     * Nested transactions are not supported and will throw.
     *
     * All queries executed using the provided `tx` builder
     * will share the same SQLite transaction and `txId`.
     *
     * If any operation inside the callback throws,
     * the entire transaction is rolled back automatically.
     *
     * Example:
     *
     * await supastash.withTransaction(async (tx) => {
     *   await tx.from("orders").insert(order).run();
     *   await tx.from("ledger").insert(ledgerEntry).run();
     * });
     *
     *
     * In this example, both inserts succeed or both fail.
     */
    withTransaction(fn: (tx: SupastashTransactionalBuilder<T, U, R>) => Promise<void> | void): Promise<void>;
}
type SupastashTransactionalBuilder<T extends CrudMethods, U extends boolean, R> = Omit<SupastashQueryBuilder<T, U, R>, "withTransaction">;
export type SupastashTransactionClient = SupastashTransactionalBuilder<CrudMethods, boolean, PayloadData>;
export type SupastashClient = SupastashTransactionalBuilder<CrudMethods, boolean, PayloadData>;
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
 *   .update<T>({ name: "John Doe" })
 *   .eq("id", "1")
 *   .run(); // Required to execute the query
 */
export declare const supastash: SupastashQueryBuilder<CrudMethods, boolean, any>;
export {};
//# sourceMappingURL=index.d.ts.map