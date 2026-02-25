import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import { logWarn } from "../../logs";
import { FetchOlderHelpers } from "./fetchOlderHelpers";

export async function fetchOlder({
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
  filters?: RealtimeFilter[];

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
