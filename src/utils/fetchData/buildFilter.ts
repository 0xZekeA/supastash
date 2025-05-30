import { FilterOperator } from "@/types/realtimeData.types";

export function buildFilterString(
  filters: {
    column: string;
    operator: FilterOperator;
    value: string | number | null | (string | number)[];
  }[]
): string | undefined {
  if (!filters || filters.length === 0) {
    return undefined;
  }

  const filterString = filters
    .map(({ column, operator, value }) => {
      if (value === null) {
        return `${column}=${operator}.null`;
      }

      if (operator === "in" && Array.isArray(value)) {
        return `${column}=in.(${value.join(",")})`;
      }

      return `${column}=${operator}.${value}`;
    })
    .join("&");

  return filterString;
}
