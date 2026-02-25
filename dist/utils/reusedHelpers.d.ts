import { RealtimeFilter, SupastashFilter } from "../types/realtimeData.types";
export declare const ReusedHelpers: {
    isValidFilter<R = any>(filters: RealtimeFilter<R>[] | SupastashFilter[]): boolean;
    applyFilters(q: any, filters: RealtimeFilter[] | SupastashFilter[], table: string): any;
};
//# sourceMappingURL=reusedHelpers.d.ts.map