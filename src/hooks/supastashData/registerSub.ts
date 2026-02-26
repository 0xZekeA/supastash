import { SupastashFilter } from "../../types/realtimeData.types";
import { ReusedHelpers } from "../../utils/reusedHelpers";

const subRegistry: Record<string, number> = {};

export function registerSub(table: string, filter?: SupastashFilter): boolean {
  const key = `${table}::${ReusedHelpers.buildFilterString(filter) ?? ""}`;
  if (subRegistry[key]) {
    subRegistry[key]++;
    return true;
  }
  subRegistry[key] = 1;
  return false;
}

export function unregisterSub(table: string, filter?: SupastashFilter): void {
  const key = `${table}::${ReusedHelpers.buildFilterString(filter) ?? ""}`;
  if (subRegistry[key]) {
    subRegistry[key]--;
    if (subRegistry[key] <= 0) {
      delete subRegistry[key];
    }
  }
}
