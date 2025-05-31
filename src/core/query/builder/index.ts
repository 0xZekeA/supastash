import {
  CrudMethods,
  FilterCalls,
  PayloadData,
  SupastashQuery,
  SyncMode,
} from "@/types/query.types";
import SupaStashCrudBuilder from "./crud";

/**
 * Builder for the supastash query
 * @param T - The method to call
 * @param U - Whether to return a single row or multiple rows
 */
export class SupaStashQueryBuilder<T extends CrudMethods, U extends boolean> {
  private readonly query: SupastashQuery & { isSingle: U; method: T };

  /**
   * Constructor for the supastash query builder
   * @param query - The query to build
   */
  constructor(query: SupastashQuery & { isSingle: U; method: T }) {
    this.query = query;
  }

  /**
   * Sets the table to query.
   *
   * @param table - The table to query.
   * @returns crud options.
   */
  from(table: string) {
    this.query.table = table;
    return new SupaStashCrudBuilder(this.query);
  }
}

/**
 * The supastash query builder.
 * Used to build queries for the supastash client.
 *
 * @returns the supastash query builder.
 * @example
 * const query = await supastash
 *   .from("users")
 *   .update({
 *     name: "John Doe",
 *   })
 *   .eq("id", "1")
 *   .run(); // (Compulsory to call run(): alias for execute())
 *
 */
const supastash = new SupaStashQueryBuilder<CrudMethods, boolean>({
  table: "" as string,
  method: "none" as unknown as CrudMethods,
  payload: null as PayloadData | null,
  filters: [] as FilterCalls[],
  limit: null as number | null,
  select: null as string | null,
  isSingle: false as boolean,
  type: "localFirst" as SyncMode,
  runSelected: false,
} as SupastashQuery & { isSingle: boolean; method: CrudMethods });

export default supastash;
