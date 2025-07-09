import { FilterOperator } from "../../types/realtimeData.types";

export function buildFilterString(
  filters:
    | {
        column: string;
        operator: FilterOperator;
        value: string | number | null | (string | number)[];
      }
    | undefined
): string | undefined {
  if (!filters) {
    return undefined;
  }
  const { column, operator, value } = filters;

  if (value === null) {
    return `${column}=${operator}.null`;
  }

  if (operator === "in" && Array.isArray(value)) {
    return `${column}=in.(${value.join(",")})`;
  }

  return `${column}=${operator}.${value}`;
}

export function buildFilterForSql(
  filter:
    | {
        column: string;
        operator: FilterOperator;
        value: string | number | null | (string | number)[];
      }
    | undefined
): string | undefined {
  if (!filter) return undefined;

  const { column, operator, value } = filter;

  switch (operator) {
    case "eq":
      return value === null
        ? `${column} IS NULL`
        : `${column} = ${sqlValue(value)}`;
    case "neq":
      return value === null
        ? `${column} IS NOT NULL`
        : `${column} != ${sqlValue(value)}`;
    case "gt":
      return `${column} > ${sqlValue(value)}`;
    case "lt":
      return `${column} < ${sqlValue(value)}`;
    case "gte":
      return `${column} >= ${sqlValue(value)}`;
    case "lte":
      return `${column} <= ${sqlValue(value)}`;
    case "in":
      if (!Array.isArray(value)) {
        throw new Error("Value must be an array for 'in' operator");
      }
      const list = value.map(sqlValue).join(", ");
      return `${column} IN (${list})`;
    case "is":
      return `${column} IS ${sqlValue(value)}`;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

function sqlValue(val: string | number | null | (string | number)[]): string {
  if (Array.isArray(val)) {
    return val.map(sqlValue).join(", ");
  }
  if (val === null) return "NULL";
  if (typeof val === "number") return val.toString();
  return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
}
