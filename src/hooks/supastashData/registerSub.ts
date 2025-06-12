import { RealtimeFilter } from "../../types/realtimeData.types";
import { buildFilterString } from "../../utils/fetchData/buildFilter";

const subRegistry: Record<string, number> = {};

export function registerSub(table: string, filter?: RealtimeFilter): boolean {
  const key = `${table}::${buildFilterString(filter) ?? ""}`;
  if (subRegistry[key]) {
    subRegistry[key]++;
    return true;
  }
  subRegistry[key] = 1;
  return false;
}

export function unregisterSub(table: string, filter?: RealtimeFilter): void {
  const key = `${table}::${buildFilterString(filter) ?? ""}`;
  if (subRegistry[key]) {
    subRegistry[key]--;
    if (subRegistry[key] <= 0) {
      delete subRegistry[key];
    }
  }
}
