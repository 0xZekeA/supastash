import { RealtimeFilter } from "../../../types/realtimeData.types";
declare function isValidFilter<R = any>(filters: RealtimeFilter<R>[]): boolean;
export default isValidFilter;
export declare function warnOnMisMatch<R = any>(table: string, filters: RealtimeFilter<R>[]): void;
//# sourceMappingURL=validateFilters.d.ts.map