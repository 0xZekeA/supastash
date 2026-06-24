/**
 * Stores per-table RPC filter nodes used by the batch pull sync path.
 * Keyed by table name, value is the array of RpcFilterNode to apply.
 */
export const rpcTableFilters = new Map();
