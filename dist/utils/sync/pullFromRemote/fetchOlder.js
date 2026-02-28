import { getSupastashConfig } from "../../../core/config";
import { logWarn } from "../../logs";
import { FetchOlderHelpers } from "./fetchOlderHelpers";
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
export async function fetchOlderPage({ boundaryTs, table, filters, limit, shouldStoreToLocalDb = true, }) {
    try {
        const isGhost = getSupastashConfig().supastashMode === "ghost";
        if (isGhost) {
            return { hasMore: false, data: [] };
        }
        const lookbackDays = await FetchOlderHelpers.getLookbackDays({
            table,
            filters,
        });
        if (boundaryTs) {
            FetchOlderHelpers.validateBoundaryTs({
                boundaryTs,
                earliestDate: lookbackDays.createdAt,
            });
        }
        const data = await FetchOlderHelpers.fetchData({
            table,
            filters,
            limit,
            boundaryTs,
            earliestDate: lookbackDays.createdAt,
            earliestId: lookbackDays.id,
        });
        if (shouldStoreToLocalDb) {
            await FetchOlderHelpers.storeToDb({ table, data });
        }
        if (data.length > limit) {
            logWarn(`[Supastash] Pagination overflow detected for table ${table}`);
        }
        return { hasMore: data.length === limit, data };
    }
    catch (error) {
        return FetchOlderHelpers.handleError(error);
    }
}
