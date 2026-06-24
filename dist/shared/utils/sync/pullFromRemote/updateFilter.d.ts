import { SupastashFilter } from "../../../types/realtimeData.types";
import { RpcTableFilters } from "../../../types/rpcFilter.types";
/**
 * Updates the filter for the given table.
 * Non-hook version of useSupastashFilters.
 *
 * @param filters - PostgREST filters for the standard pull path. Automatically converted
 *   and applied in the batch RPC pull path too.
 * @param rpcFilters - Optional supplemental RPC filter nodes. Only needed for `and` groups
 *   or other constructs SupastashFilter can't express.
 */
export declare function updateFilters(filters: SupastashFilter, rpcFilters?: RpcTableFilters): Promise<void>;
//# sourceMappingURL=updateFilter.d.ts.map