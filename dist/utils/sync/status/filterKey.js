import * as ExpoCrypto from "expo-crypto";
// let sha256: (s: string) => Promise<string>;
// try {
//   const crypto = require("react-native-quick-crypto");
//   if (crypto.createHash) {
//     sha256 = async (msg) =>
//       crypto.createHash("sha256").update(msg).digest("hex");
//   } else {
//     throw new Error("createHash not available");
//   }
// } catch {
//   const ExpoCrypto = require("expo-crypto");
//   sha256 = (msg) =>
//     ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, msg);
// }
/**
 * Normalizes a value
 * @param v - The value to normalize
 * @returns The normalized value
 */
function normVal(v) {
    if (v === null || v === undefined)
        return null;
    if (Array.isArray(v))
        return v.map(String).sort();
    return typeof v === "number" ? String(v) : String(v);
}
/**
 * Canonicalizes a set of filters
 * @param filters - The filters to canonicalize
 * @returns The canonicalized filters
 */
export function canonicalizeFilters(filters) {
    const list = (filters ?? [])
        .filter((f) => !!f && typeof f === "object" && "column" in f && "operator" in f)
        .map((f) => ({
        column: String(f.column),
        operator: f.operator,
        value: normVal(f.value),
    }));
    list.sort((a, b) => {
        if (a.column !== b.column)
            return a.column < b.column ? -1 : 1;
        if (a.operator !== b.operator)
            return a.operator < b.operator ? -1 : 1;
        const av = JSON.stringify(a.value);
        const bv = JSON.stringify(b.value);
        return av < bv ? -1 : av > bv ? 1 : 0;
    });
    return JSON.stringify(list);
}
/**
 * Computes the filter key for a given set of filters
 * @param filters - The filters to compute the key for
 * @param ns - The namespace to use for the key
 * @returns The computed filter key
 */
export async function computeFilterKey(filters, ns = "global") {
    const canon = canonicalizeFilters(filters);
    const namespaced = JSON.stringify({ ns, filters: JSON.parse(canon) });
    return ExpoCrypto.digestStringAsync(ExpoCrypto.CryptoDigestAlgorithm.SHA256, namespaced);
}
