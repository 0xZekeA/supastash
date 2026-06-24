import { Filter, SupastashFilter } from "../../../types/realtimeData.types";
import { RpcFilterNode, RpcFilterOp } from "../../../types/rpcFilter.types";

/**
 * Converts a single PostgREST Filter to an RpcFilterNode.
 * Used so that tableFilters registered via useSupastashFilters are
 * automatically applied in the batch pull RPC path.
 */
function convertFilter(f: Filter): RpcFilterNode | null {
  const col = String(f.column);

  if (f.operator === "is") {
    return f.value === null
      ? { col, op: "is_null" }
      : { col, op: "is_not_null" };
  }

  // For "in", the SQL compiler expects a comma-separated string
  if (f.operator === "in") {
    const val = Array.isArray(f.value)
      ? (f.value as (string | number)[]).join(",")
      : String(f.value ?? "");
    return { col, op: "in", val };
  }

  return {
    col,
    op: f.operator as RpcFilterOp,
    val: f.value as string | number,
  };
}

/**
 * Converts PostgREST-style SupastashFilter[] to RpcFilterNode[].
 * Supports simple filters and { or: [...] } groups.
 * Returns an empty array for an empty/undefined input.
 */
export function postgrestFiltersToRpc(
  filters: SupastashFilter[] | undefined
): RpcFilterNode[] {
  if (!filters?.length) return [];

  const result: RpcFilterNode[] = [];
  for (const f of filters) {
    if ("or" in f) {
      const nodes = f.or
        .map(convertFilter)
        .filter((n): n is RpcFilterNode => n !== null);
      if (nodes.length) result.push({ or: nodes });
    } else {
      const node = convertFilter(f);
      if (node) result.push(node);
    }
  }
  return result;
}
