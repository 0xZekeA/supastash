import { CrudMethods, SupastashQuery } from "../../../types/query.types";
import SupastashFilterBuilder from "./filters";

/**
 * Builder for the CRUD methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */

export default class SupastashCrudBuilder<
  T extends CrudMethods,
  U extends boolean,
  R
> {
  /**
   * Constructor for the CRUD builder
   * @param query - The query to build
   */
  constructor(private readonly query: SupastashQuery<T, U, R>) {}

  /**
   * Sets the method to insert.
   *
   * @param data - The data to insert.
   * @returns filter options.
   */
  insert(data: R) {
    const newQuery = {
      ...this.query,
      method: "insert" as T,
      payload: data,
    };
    return new SupastashFilterBuilder<"insert", false, R>(
      newQuery as SupastashQuery<"insert", false, R>
    );
  }

  /**
   * Sets the method to update.
   *
   * @param data - The data to update.
   * @returns filter options.
   */
  update(data: R) {
    const newQuery = {
      ...this.query,
      method: "update" as T,
      payload: data,
    };
    return new SupastashFilterBuilder<"update", false, R>(
      newQuery as SupastashQuery<"update", false, R>
    );
  }

  /**
   * Sets the method to delete.
   *
   * @returns filter options.
   */
  delete() {
    const newQuery = {
      ...this.query,
      method: "delete" as T,
    };
    return new SupastashFilterBuilder<"delete", false, R>(
      newQuery as SupastashQuery<"delete", false, R>
    );
  }

  /**
   * Sets the method to select.
   *
   * @param column - The column to select.
   * @returns filter options.
   */
  select(column?: string) {
    const newQuery = {
      ...this.query,
      method: "select" as T,
      select: column ?? "*",
    };
    return new SupastashFilterBuilder<"select", false, R>(
      newQuery as SupastashQuery<"select", false, R>
    );
  }

  /**
   * Sets the method to upsert.
   *
   * @param data - The data to upsert.
   * @returns filter options.
   */
  upsert(data: R | R[]) {
    const newQuery = {
      ...this.query,
      method: "upsert" as T,
      payload: data,
    };
    return new SupastashFilterBuilder<"upsert", false, R>(
      newQuery as SupastashQuery<"upsert", false, R>
    );
  }
}
