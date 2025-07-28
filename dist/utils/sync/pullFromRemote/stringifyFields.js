import { NITRO_SQLITE_NULL } from "react-native-nitro-sqlite";
import { getSupastashConfig } from "../../../core/config";
import { isTrulyNullish } from "../../serializer";
let isNitro = null;
export function stringifyComplexFields(record) {
    if (isNitro === null) {
        isNitro = getSupastashConfig().sqliteClientType === "rn-nitro";
    }
    const result = {};
    for (const key in record) {
        const value = record[key];
        if (isTrulyNullish(value)) {
            result[key] = isNitro ? NITRO_SQLITE_NULL : undefined;
        }
        else if (typeof value === "object" && value !== null) {
            result[key] = JSON.stringify(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
export function stringifyValue(value) {
    if (isNitro === null) {
        isNitro = getSupastashConfig().sqliteClientType === "rn-nitro";
    }
    if (isTrulyNullish(value)) {
        return isNitro ? NITRO_SQLITE_NULL : undefined;
    }
    else if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
    }
    else {
        return value;
    }
}
