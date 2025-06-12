import { FilterCalls } from "../../../../types/query.types";
/**
 * Builds a parameterized SQL WHERE clause from selected list of filters.
 *
 * @param filters - The filters to apply to the query
 * @returns An object with the SQL clause and bound values
 */
export declare function buildWhereClause(filters: FilterCalls[] | null): {
    clause: string;
    values: any[];
};
//# sourceMappingURL=queryFilterBuilder.d.ts.map