import { CrudMethods, PayloadData, SupastashQuery } from "@/types/query.types";
import SupaStashFilterBuilder from "./filters";

/**
 * Builder for the CRUD methods
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export default class SupaStashCrudBuilder<
  T extends CrudMethods,
  U extends boolean
> {
  /**
   * Constructor for the CRUD builder
   * @param query - The query to build
   */
  constructor(
    private readonly query: SupastashQuery & { isSingle: U; method: T }
  ) {}

  /**
   * Sets the method to insert.
   *
   * @param data - The data to insert.
   * @returns filter options.
   */
  insert(data: PayloadData) {
    this.query.method = "insert" as T;
    this.query.payload = data;
    return new SupaStashFilterBuilder<"insert", false>(
      this.query as SupastashQuery & { isSingle: false; method: "insert" }
    );
  }

  /**
   * Sets the method to update.
   *
   * @param data - The data to update.
   * @returns filter options.
   */
  update(data: PayloadData) {
    this.query.method = "update" as T;
    this.query.payload = data;
    return new SupaStashFilterBuilder<"update", false>(
      this.query as SupastashQuery & { isSingle: false; method: "update" }
    );
  }

  /**
   * Sets the method to delete.
   *
   * @returns filter options.
   */
  delete() {
    this.query.method = "delete" as T;
    return new SupaStashFilterBuilder<"delete", false>(
      this.query as SupastashQuery & { isSingle: false; method: "delete" }
    );
  }

  /**
   * Sets the method to select.
   *
   * @param column - The column to select.
   * @returns filter options.
   */
  select(column?: string) {
    this.query.method = "select" as T;
    this.query.select = column ?? "*";
    return new SupaStashFilterBuilder<"select", false>(
      this.query as SupastashQuery & { isSingle: false; method: "select" }
    );
  }
}
