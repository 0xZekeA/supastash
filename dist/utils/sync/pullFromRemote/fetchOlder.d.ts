import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
/**
 * Fetches a backward page of records from the server relative to the current
 * earliest locally stored row.
 *
 * This function performs cursor-based backward pagination by:
 * - Determining the earliest known local record for the table
 * - Validating the provided boundary timestamp
 * - Fetching older records from the server up to the specified limit
 * - Optionally persisting the results into the local database
 *
 * Designed for infinite scroll and historical lookback scenarios.
 *
 * @returns An object containing:
 * - `data`: The fetched records
 * - `hasMore`: Whether additional older records may exist
 */
export declare function fetchOlderPage({ boundaryTs, table, filters, limit, shouldStoreToLocalDb, }: {
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