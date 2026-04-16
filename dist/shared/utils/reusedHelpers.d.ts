import { SupastashFilter } from "../types/realtimeData.types";
export declare const ReusedHelpers: {
    isValidFilter<R = any>(filters: SupastashFilter<R>[]): boolean;
    applyFilters(q: any, filters: SupastashFilter[], table: string): any;
    buildFilterString<R = any>(filter: SupastashFilter<R> | undefined): string | undefined;
    buildFilterForSql<R = any>(filter: SupastashFilter<R> | undefined): string | undefined;
};
//# sourceMappingURL=reusedHelpers.d.ts.map