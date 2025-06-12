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
