import { PayloadData } from "../../types/query.types";
/**
 * Fetches the local data from the database
 * @param table - The table name to fetch from
 * @param shouldFetch - Whether to fetch the data
 * @param limit - Optional limit for rows
 * @param extraMapKeys - Optional fields to group data by
 */
export declare function fetchLocalData<R>(table: string, shouldFetch?: boolean, limit?: number, extraMapKeys?: (keyof R)[], daylength?: number): Promise<{
    data: PayloadData[];
    dataMap: Map<string, PayloadData>;
    groupedBy: {
        [K in keyof R]: Map<R[K], Array<PayloadData>>;
    };
} | null>;
//# sourceMappingURL=fetchLocalData.d.ts.map