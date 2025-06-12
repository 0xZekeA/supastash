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
     * @param data - The data to insert.
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
     * @param data - The data to upsert.
     * @returns filter options.
     */
    upsert(data) {
        const newQuery = {
            ...this.query,
            method: "upsert",
            payload: data,
        };
        return new SupastashFilterBuilder(newQuery);
    }
}
