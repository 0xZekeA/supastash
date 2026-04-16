import { getSupastashDb } from "../../../db/dbInitializer";
import { txStore } from "../../../store/tx";
import { generateUUIDv4 } from "../../genUUID";
import { queueRemoteCall } from "../helpers/queueRemote";
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
        const id = generateUUIDv4();
        const newQuery = { ...this.query, table, id };
        return new SupastashCrudBuilder(newQuery);
    }
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
    withTransaction(fn) {
        const query = async () => {
            // Create a new transaction id
            const newTxId = generateUUIDv4();
            try {
                const db = await getSupastashDb();
                // Add the transaction to the store
                txStore[newTxId] = [];
                // Execute the local calls
                await db.withTransaction(async (tx) => {
                    const txQuery = {
                        ...this.query,
                        txId: newTxId,
                        tx,
                        throwOnError: true, // Throw the error to roll back the transaction
                    };
                    const txBuilder = new SupastashQueryBuilder(txQuery);
                    return fn(txBuilder);
                });
                // Execute the remote calls
                const remoteCalls = txStore[newTxId] ?? [];
                if (remoteCalls.length > 0) {
                    const newStates = remoteCalls.map((call) => {
                        return {
                            ...call,
                            txId: null,
                            tx: null,
                            withTx: false,
                            type: "remoteOnly",
                        };
                    });
                    for (const state of newStates) {
                        queueRemoteCall(state);
                    }
                }
            }
            finally {
                // Delete the transaction from the store
                delete txStore[newTxId];
            }
        };
        return query();
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
 *   .update<T>({ name: "John Doe" })
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
    onConflictKeys: ["id"],
    preserveTimestamp: false,
    throwOnError: false,
    fetchPolicy: null,
    // With tx
    txId: null,
    tx: null,
    withTx: false,
});
