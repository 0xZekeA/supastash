import { SupastashFilter } from "../../types/realtimeData.types";
export declare function parseJSONColumns<R extends Record<string, any>>(row: R): R;
export declare function sanitizeTableName(table: string): string;
export declare function sanitizeOrderBy(orderBy: string): string;
export declare function buildFilters<R = any>(filters: SupastashFilter<R>[], table: string, noChecks?: boolean): Promise<string>;
//# sourceMappingURL=liteHelpers.d.ts.map