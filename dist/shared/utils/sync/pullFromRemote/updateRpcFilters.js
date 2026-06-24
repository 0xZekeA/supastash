import { rpcTableFilters } from "../../../store/rpcTableFilters";
import { logWarn } from "../../logs";
import { checkIfTableExist } from "../../tableValidator";
/**
 * Registers explicit RPC filter nodes for the batch pull path (useBatchPullSync: true).
 *
 * Only needed for constructs SupastashFilter can't express (e.g. `and` groups).
 * Filters registered via useSupastashFilters / updateFilters are automatically
 * converted and applied in the batch path — no separate call needed for those.
 *
 * Called automatically by useSupastashFilters / updateFilters.
 */
export async function updateRpcFilters(filters) {
    const incoming = Object.keys(filters ?? {});
    // Remove stale tables no longer in the incoming set
    for (const t of Array.from(rpcTableFilters.keys())) {
        if (!incoming.includes(t)) {
            rpcTableFilters.delete(t);
        }
    }
    if (!incoming.length)
        return;
    const existence = await Promise.all(incoming.map(async (t) => [t, await checkIfTableExist(t)]));
    for (const [table, exists] of existence) {
        if (!exists) {
            logWarn(`[Supastash] Table '${table}' does not exist; skipping RPC filters`);
            continue;
        }
        const nodes = (filters[table] ?? []);
        if (!nodes.length) {
            rpcTableFilters.delete(table);
            continue;
        }
        rpcTableFilters.set(table, nodes.map((n) => ({ ...n })));
    }
}
