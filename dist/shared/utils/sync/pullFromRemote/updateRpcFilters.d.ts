import { RpcTableFilters } from "../../../types/rpcFilter.types";
/**
 * Registers explicit RPC filter nodes for the batch pull path (useBatchPullSync: true).
 *
 * Only needed for constructs SupastashFilter can't express (e.g. `and` groups).
 * Filters registered via useSupastashFilters / updateFilters are automatically
 * converted and applied in the batch path — no separate call needed for those.
 *
 * Called automatically by useSupastashFilters / updateFilters.
 */
export declare function updateRpcFilters(filters?: RpcTableFilters): Promise<void>;
//# sourceMappingURL=updateRpcFilters.d.ts.map