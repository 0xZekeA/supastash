import { getSupastashConfig } from "../../../core/config";
let isNitro = null;
export function stringifyComplexFields(record) {
    if (isNitro === null) {
        isNitro = getSupastashConfig().sqliteClientType === "rn-nitro";
    }
    const result = {};
    for (const key in record) {
        const value = record[key];
        if (typeof value === "object" && value !== null) {
            result[key] = JSON.stringify(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
export function stringifyValue(value) {
    if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
    }
    else {
        return value;
    }
}
