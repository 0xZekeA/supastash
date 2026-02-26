import { SupastashFilter } from "../../types/realtimeData.types";
export declare function buildFilterString<R = any>(
  filters: SupastashFilter<R> | undefined
): string | undefined;
export declare function buildFilterForSql<R = any>(
  filter: SupastashFilter<R> | SupastashFilter<R> | undefined | undefined
): string | undefined;
//# sourceMappingURL=buildFilter.d.ts.map
