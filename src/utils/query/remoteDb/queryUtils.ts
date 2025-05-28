import { CrudMethods, PayloadData } from "@/types/query.types";

/**
 * Gets filter key for supabase call
 *
 * @param op - The operator to map
 * @returns
 */
export function operatorMap(
  op: string
): "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "like" | "in" | "is" {
  switch (op) {
    case "=":
      return "eq";
    case "!=":
      return "neq";
    case ">":
      return "gt";
    case "<":
      return "lt";
    case ">=":
      return "gte";
    case "<=":
      return "lte";
    case "LIKE":
      return "like";
    case "IN":
      return "in";
    case "IS":
      return "is";
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
}

/**
 * Gets method for supabase call
 *
 * @param query - The query to modify
 * @param method - The method to call
 * @param select - The columns to select
 * @param payload - The payload to insert
 * @returns query
 */
export function getMethod(
  query: any,
  method: CrudMethods | null,
  select: string | null,
  payload: PayloadData | null
) {
  switch (method) {
    case "select":
      return (query = query.select(select || "*"));
    case "insert":
      return query.insert(payload!);
    case "update":
      return (query = query.update(payload!));
    case "delete":
      return (query = query.update({ deleted_at: new Date().toISOString() }));
    default:
      throw new Error("No method defined for Supastash query");
  }
}
