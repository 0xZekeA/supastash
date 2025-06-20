import { CrudMethods, SupastashQuery } from "../../../types/query.types";
import SupastashFilterBuilder from "./filters";
/**
 * Builder for the CRUD methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupastashCrudBuilder<T extends CrudMethods, U extends boolean, R> {
    private readonly query;
    /**
     * Constructor for the CRUD builder
     * @param query - The query to build
     */
    constructor(query: SupastashQuery<T, U, R>);
    /**
     * Sets the method to insert.
     *
     * @param data - The data to insert. Could be a single object or an array of objects.
     * @returns filter options.
     */
    insert<Z>(data: R): SupastashFilterBuilder<"insert", false, R, Z>;
    /**
     * Sets the method to update.
     *
     * @param data - The data to update.
     * @returns filter options.
     */
    update<Z>(data: R): SupastashFilterBuilder<"update", false, R, Z>;
    /**
     * Sets the method to delete.
     *
     * @returns filter options.
     */
    delete<Z>(): SupastashFilterBuilder<"delete", false, R, Z>;
    /**
     * Sets the method to select.
     *
     * @param column - The column to select.
     * @returns filter options.
     */
    select<Z>(column?: string): SupastashFilterBuilder<"select", false, R, Z>;
    /**
     * Sets the method to upsert.
     *
     * @example
     * ```ts
     * await supastash
     *   .from("chats")
     *   .upsert<T>({ chat_id: "abc", user_id: "u1", status: "open" }, {
     *     onConflictKeys: ["chat_id", "user_id"]
     *   })
     *   .run();
     * ```
     * @param data - The data to upsert. Could be a single object or an array of objects.
     * @param options - The options for the upsert.
     * @param options.onConflictKeys - The keys to use for the on conflict.
     *
     * @returns filter options.
     */
    upsert<Z>(data: R | R[], options?: {
        onConflictKeys?: string[];
    }): SupastashFilterBuilder<"upsert", false, R, Z>;
}
//# sourceMappingURL=crud.d.ts.map