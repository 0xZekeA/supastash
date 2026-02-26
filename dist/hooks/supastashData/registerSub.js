import { ReusedHelpers } from "../../utils/reusedHelpers";
const subRegistry = {};
export function registerSub(table, filter) {
    const key = `${table}::${ReusedHelpers.buildFilterString(filter) ?? ""}`;
    if (subRegistry[key]) {
        subRegistry[key]++;
        return true;
    }
    subRegistry[key] = 1;
    return false;
}
export function unregisterSub(table, filter) {
    const key = `${table}::${ReusedHelpers.buildFilterString(filter) ?? ""}`;
    if (subRegistry[key]) {
        subRegistry[key]--;
        if (subRegistry[key] <= 0) {
            delete subRegistry[key];
        }
    }
}
