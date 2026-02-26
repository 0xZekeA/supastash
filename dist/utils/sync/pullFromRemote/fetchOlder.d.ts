import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
export declare function fetchOlder({ boundaryTs, table, filters, limit, shouldStoreToLocalDb, }: {
    /**
     * The timestamp to cap lookback at.
     */
    boundaryTs: string;
    /**
     * The table to fetch data from.
     */
    table: string;
    /**
     * The filters to apply to the data.
     */
    filters?: SupastashFilter[];
    /**
     * The maximum number of records to fetch.
     */
    limit: number;
    /**
     * The data to store to the database.
     */
    shouldStoreToLocalDb?: boolean;
}): Promise<{
    hasMore: boolean;
    data: PayloadData[];
}>;
//# sourceMappingURL=fetchOlder.d.ts.map