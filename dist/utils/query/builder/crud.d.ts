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
     * @param data - The data to insert.
     * @returns filter options.
     */
    insert(data: R): SupastashFilterBuilder<"insert", false, R>;
    /**
     * Sets the method to update.
     *
     * @param data - The data to update.
     * @returns filter options.
     */
    update(data: R): SupastashFilterBuilder<"update", false, R>;
    /**
     * Sets the method to delete.
     *
     * @returns filter options.
     */
    delete(): SupastashFilterBuilder<"delete", false, R>;
    /**
     * Sets the method to select.
     *
     * @param column - The column to select.
     * @returns filter options.
     */
    select(column?: string): SupastashFilterBuilder<"select", false, R>;
    /**
     * Sets the method to upsert.
     *
     * @param data - The data to upsert.
     * @returns filter options.
     */
    upsert(data: R | R[]): SupastashFilterBuilder<"upsert", false, R>;
}
//# sourceMappingURL=crud.d.ts.map