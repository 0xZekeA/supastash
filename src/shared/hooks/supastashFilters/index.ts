import { useEffect } from "react";
import {
  filterTracker,
  tableFilters,
  tableFiltersUsed,
} from "../../store/tableFilters";
import { SupastashFilter } from "../../types/realtimeData.types";
import { RpcTableFilters } from "../../types/rpcFilter.types";
import { logWarn } from "../../utils/logs";
import { ReusedHelpers } from "../../utils/reusedHelpers";
import { updateRpcFilters } from "../../utils/sync/pullFromRemote/updateRpcFilters";
import { warnOnMisMatch } from "../../utils/sync/pullFromRemote/validateFilters";
import { checkIfTableExist } from "../../utils/tableValidator";

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
export function useSupastashFilters(
  filters?: Record<string, SupastashFilter[]>,
  rpcFilters?: RpcTableFilters
) {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (rpcFilters) {
        await updateRpcFilters(rpcFilters);
      }

      if (!filters) return;
      const incoming = Object.keys(filters);

      if (!incoming.length) return;

      // Remove stale tables
      for (const t of Array.from(tableFilters.keys()) || []) {
        if (!incoming.includes(t)) {
          tableFilters.delete(t);
          tableFiltersUsed.delete(t);
          filterTracker.delete(t);
        }
      }

      // Existence check + per-table registration
      const existence = await Promise.all(
        incoming.map(async (t) => [t, await checkIfTableExist(t)] as const)
      );
      if (cancelled) return;

      for (const [table, exists] of existence) {
        if (!exists) {
          logWarn(`Table '${table}' does not exist; skipping filters`);
          continue;
        }

        const raw = (filters[table as keyof typeof filters] ??
          []) as SupastashFilter[];
        const valid = raw.filter((f) => ReusedHelpers.isValidFilter([f]));
        if (!valid.length) {
          tableFilters.delete(table);
          tableFiltersUsed.delete(table);
          filterTracker.delete(table);
          continue;
        }

        // Warn on signature change and store a cloned array
        warnOnMisMatch(table, valid);
        tableFilters.set(
          table,
          valid.map((v) => ({ ...v }))
        );
        tableFiltersUsed.add(table);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [filters, rpcFilters]);
}
