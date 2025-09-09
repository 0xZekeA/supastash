import { syncCalls } from "../../../store/syncCalls";
import { SyncEntry } from "../../../types/syncEngine.types";
import log from "../../../utils/logs";

/**
 * Register a sync call (push/pull) for a given table.
 * Prevents overriding existing entries unless allowOverride = true.
 */
export function registerSyncCall(
  table: string,
  entry: SyncEntry,
  { allowOverride = false }: { allowOverride?: boolean } = {}
) {
  if (syncCalls.has(table) && !allowOverride) {
    log(`[Supastash] table '${table}' already registered, skipping`);
    return;
  }
  syncCalls.set(table, entry);
}

/**
 * Remove a sync call registration for a given table.
 */
export function unregisterSyncCall(table: string) {
  syncCalls.delete(table);
}

/**
 * Retrieve the sync call (push/pull) registered for a given table.
 */
export function getSyncCall(table: string): SyncEntry | undefined {
  return syncCalls.get(table);
}

/**
 * Get a list of all registered table names that have sync calls.
 */
export function getAllSyncTables(): string[] {
  return Array.from(syncCalls.keys());
}

/**
 * Clear all sync call registrations.
 */
export function clearSyncCalls() {
  syncCalls.clear();
}
