import { FilterOperator } from "../../types/realtimeData.types";
export declare function buildFilterString(filters: {
    column: string;
    operator: FilterOperator;
    value: string | number | null | (string | number)[];
} | undefined): string | undefined;
//# sourceMappingURL=buildFilter.d.ts.map