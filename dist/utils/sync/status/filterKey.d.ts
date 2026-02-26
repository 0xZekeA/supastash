import { SupastashFilter } from "../../../types/realtimeData.types";
/**
 * Canonicalizes a set of filters
 * @param filters - The filters to canonicalize
 * @returns The canonicalized filters
 */
export declare function canonicalizeFilters(filters?: SupastashFilter[] | null): string;
/**
 * Computes the filter key for a given set of filters
 * @param filters - The filters to compute the key for
 * @param ns - The namespace to use for the key
 * @returns The computed filter key
 */
export declare function computeFilterKey(filters?: SupastashFilter[] | null, ns?: string): Promise<string>;
//# sourceMappingURL=filterKey.d.ts.map