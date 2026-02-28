import { getSupastashConfig } from "../../../core/config";
import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
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
export async function fetchOlderPage({
  boundaryTs,
  table,
  filters,
  limit,
  shouldStoreToLocalDb = true,
}: {
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
}): Promise<{ hasMore: boolean; data: PayloadData[] }> {
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
  } catch (error: any) {
    return FetchOlderHelpers.handleError(error);
  }
}
