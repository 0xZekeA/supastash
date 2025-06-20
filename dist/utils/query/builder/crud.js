import SupastashFilterBuilder from "./filters";
/**
 * Builder for the CRUD methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupastashCrudBuilder {
    /**
     * Constructor for the CRUD builder
     * @param query - The query to build
     */
    constructor(query) {
        this.query = query;
    }
    /**
     * Sets the method to insert.
     *
     * @param data - The data to insert. Could be a single object or an array of objects.
     * @returns filter options.
     */
    insert(data) {
        const newQuery = {
            ...this.query,
            method: "insert",
            payload: data,
        };
        return new SupastashFilterBuilder(newQuery);
    }
    /**
     * Sets the method to update.
     *
     * @param data - The data to update.
     * @returns filter options.
     */
    update(data) {
        const newQuery = {
            ...this.query,
            method: "update",
            payload: data,
        };
        return new SupastashFilterBuilder(newQuery);
    }
    /**
     * Sets the method to delete.
     *
     * @returns filter options.
     */
    delete() {
        const newQuery = {
            ...this.query,
            method: "delete",
        };
        return new SupastashFilterBuilder(newQuery);
    }
    /**
     * Sets the method to select.
     *
     * @param column - The column to select.
     * @returns filter options.
     */
    select(column) {
        const newQuery = {
            ...this.query,
            method: "select",
            select: column ?? "*",
        };
        return new SupastashFilterBuilder(newQuery);
    }
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
    upsert(data, options) {
        const newQuery = {
            ...this.query,
            method: "upsert",
            payload: data,
            onConflictKeys: options?.onConflictKeys ?? ["id"],
        };
        return new SupastashFilterBuilder(newQuery);
    }
}
