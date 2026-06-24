import { SupastashFilter } from "../../types/realtimeData.types";
import { RpcTableFilters } from "../../types/rpcFilter.types";
/**
 * useSupastashFilters
 *
 * @description
 * Registers filters used for Supastash pull sync logic.
 *
 * This hook should be called at app startup or anywhere your filter configuration might change.
 * You should provide filters for **all tables** unless your Supabase project uses strict SELECT RLS (Row Level Security) policies.
 *
 * The hook validates filter structure, warns about invalid filters, and detects any mismatch in column/operator structure
 * to prevent sync inconsistencies.
 *
 * 🚨 Incorrect or mismatched filters can lead to unreliable syncing behavior.
 *
 * @example
 * ```ts
 * useSupastashFilters({
 *   orders: [
 *     { column: "shop_id", operator: "eq", value: currentShopId },
 *     { column: "status", operator: "in", value: ["pending", "completed"] },
 *   ],
 *   inventory: [
 *     { column: "location_id", operator: "eq", value: activeLocationId },
 *   ],
 * });
 * ```
 *
 * @param {Record<string, SupastashFilter[]>} filters - Per-table filters applied to both the
 *   per-table pull path and (automatically converted) the batch RPC pull path.
 *   Covers eq, neq, gt, gte, lt, lte, in, is (null / not-null), and or-groups.
 * @param {RpcTableFilters} rpcFilters - Optional supplemental RPC filter nodes for the batch
 *   pull path only. Only needed when you require `and` groups, which `SupastashFilter` doesn't
 *   support. These are merged with the auto-converted `filters` before the RPC call.
 *
 * @note This hook does not re-run unless the `filters` or `rpcFilters` object reference changes.
 *       To force re-evaluation, pass a fresh object (not just mutated data).
 */
export declare function useSupastashFilters(filters?: Record<string, SupastashFilter[]>, rpcFilters?: RpcTableFilters): void;
//# sourceMappingURL=index.d.ts.map