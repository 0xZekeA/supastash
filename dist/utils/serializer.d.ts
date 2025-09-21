export declare function isTrulyNullish(value: any): boolean;
/**
 * Deterministically stringify any value:
 * - Sorts object keys for stability
 * - Converts Date -> ISO string
 * - Converts BigInt -> string
 * - Replaces NaN/Infinity/undefined with null
 * - Handles circular references
 */
export declare function stableStringify(input: any): string;
/**
 * Normalize a value to something SQLite can bind safely:
 * - Dates -> ISO string
 * - Booleans -> 1/0
 * - Arrays/Objects -> stable JSON string
 * - BigInt -> string
 * - undefined/NaN/Infinity -> null
 * - Everything else passes through
 */
export declare function getSafeValue(value: any): any;
//# sourceMappingURL=serializer.d.ts.map