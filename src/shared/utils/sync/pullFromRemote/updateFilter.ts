import {
  filterTracker,
  tableFilters,
  tableFiltersUsed,
} from "../../../store/tableFilters";
import { SupastashFilter } from "../../../types/realtimeData.types";
import { RpcTableFilters } from "../../../types/rpcFilter.types";
import { logWarn } from "../../logs";
import { ReusedHelpers } from "../../reusedHelpers";
import { checkIfTableExist } from "../../tableValidator";
import { updateRpcFilters } from "./updateRpcFilters";
import { warnOnMisMatch } from "./validateFilters";

/**
 * Updates the filter for the given table.
 * Non-hook version of useSupastashFilters.
 *
 * @param filters - PostgREST filters for the standard pull path. Automatically converted
 *   and applied in the batch RPC pull path too.
 * @param rpcFilters - Optional supplemental RPC filter nodes. Only needed for `and` groups
 *   or other constructs SupastashFilter can't express.
 */
export async function updateFilters(
  filters: SupastashFilter,
  rpcFilters?: RpcTableFilters,
) {
  if (rpcFilters) {
    await updateRpcFilters(rpcFilters);
  }

  const incoming = Object.keys(filters ?? {});
  // Remove stale tables
  for (const t of Array.from(tableFilters.keys())) {
    if (!incoming.includes(t)) {
      tableFilters.delete(t);
      tableFiltersUsed.delete(t);
      filterTracker.delete(t);
    }
  }

  // Existence check + per-table registration
  const existence = await Promise.all(
    incoming.map(async (t) => [t, await checkIfTableExist(t)] as const),
  );

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
      valid.map((v) => ({ ...v })),
    );
    tableFiltersUsed.add(table);
  }
}
