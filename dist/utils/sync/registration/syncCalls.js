import { syncCalls } from "../../../store/syncCalls";
import log from "../../../utils/logs";
/**
 * Register a sync call (push/pull) for a given table.
 * Prevents overriding existing entries unless allowOverride = true.
 */
export function registerSyncCall(table, entry, { allowOverride = false } = {}) {
    if (syncCalls.has(table) && !allowOverride) {
        log(`[Supastash] table '${table}' already registered, skipping`);
        return;
    }
    syncCalls.set(table, entry);
}
/**
 * Remove a sync call registration for a given table.
 */
export function unregisterSyncCall(table) {
    syncCalls.delete(table);
}
/**
 * Retrieve the sync call (push/pull) registered for a given table.
 */
export function getSyncCall(table) {
    return syncCalls.get(table);
}
/**
 * Get a list of all registered table names that have sync calls.
 */
export function getAllSyncTables() {
    return Array.from(syncCalls.keys());
}
/**
 * Clear all sync call registrations.
 */
export function clearSyncCalls() {
    syncCalls.clear();
}
