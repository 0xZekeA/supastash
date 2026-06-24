import { SupastashFilter } from "../../../types/realtimeData.types";
import { RpcFilterNode } from "../../../types/rpcFilter.types";
/**
 * Converts PostgREST-style SupastashFilter[] to RpcFilterNode[].
 * Supports simple filters and { or: [...] } groups.
 * Returns an empty array for an empty/undefined input.
 */
export declare function postgrestFiltersToRpc(filters: SupastashFilter[] | undefined): RpcFilterNode[];
//# sourceMappingURL=postgrestToRpc.d.ts.map