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
