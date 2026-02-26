import { getSupastashConfig } from "../../../core/config";
import { logWarn } from "../../logs";
import { FetchOlderHelpers } from "./fetchOlderHelpers";
export async function fetchOlder({ boundaryTs, table, filters, limit, shouldStoreToLocalDb = true, }) {
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
