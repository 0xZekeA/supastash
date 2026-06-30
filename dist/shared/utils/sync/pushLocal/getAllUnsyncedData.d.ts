import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
/**
 * Builds a combined " AND (...)" SQL string + params array from a list of filters.
 * Never throws — malformed filters are skipped and logged.
 */
export declare function buildFilterSql(filters: SupastashFilter[]): {
    sql: string;
    params: unknown[];
};
/**
 * Gets all unsynced data from a table
 * @param table - The table to get the data from
 * @returns The unsynced data
 */
export declare function getAllUnsyncedData(table: string): Promise<PayloadData[] | null>;
/**
 * Gets all deleted data from a table
 * @param table - The table to get the data from
 * @returns The deleted data
 */
export declare function getAllDeletedData(table: string): Promise<PayloadData[] | null>;
//# sourceMappingURL=getAllUnsyncedData.d.ts.map