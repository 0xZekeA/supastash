import { supastashEventBus } from "./events/eventBus";

const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();
const timesFetched = new Map<string, number>();

/**
 * Debounced refresh: emit only once per table within delay window.
 */
export function refreshScreen(table: string): void {
  timesFetched.set(table, (timesFetched.get(table) || 0) + 1);
  const timeoutMs = (timesFetched.get(table) || 0) > 30 ? 800 : 500;

  clearTimeout(debounceMap.get(table));

  const timeout = setTimeout(() => {
    supastashEventBus.emit(`refresh:${table}`);
    supastashEventBus.emit(`supastash:refreshZustand:${table}`);
    timesFetched.delete(table);
    debounceMap.delete(table);
  }, timeoutMs);

  debounceMap.set(table, timeout);
}
