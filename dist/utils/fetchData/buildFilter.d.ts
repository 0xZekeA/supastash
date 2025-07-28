import { FilterOperator } from "../../types/realtimeData.types";
export declare function buildFilterString<R = any>(filters: {
    column: keyof R | string;
    operator: FilterOperator;
    value: string | number | null | (string | number)[];
} | undefined): string | undefined;
export declare function buildFilterForSql<R = any>(filter: {
    column: keyof R | string;
    operator: FilterOperator;
    value: string | number | null | (string | number)[];
} | undefined): string | undefined;
//# sourceMappingURL=buildFilter.d.ts.map