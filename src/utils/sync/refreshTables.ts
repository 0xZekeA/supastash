import { supastashEventBus } from "../events/eventBus";

const debouncedTableEmitters = new Map<string, () => void>();

/**
 * Refreshes a single table
 * Use this when you want to update data to UI
 * @param table - The name of the table to refresh
 */
export function refreshTable(table: string) {
  if (!debouncedTableEmitters.has(table)) {
    const fn = debounce(() => {
      supastashEventBus.emit(`refresh:${table}`);
    }, 100);
    debouncedTableEmitters.set(table, fn);
  }

  debouncedTableEmitters.get(table)!();
}

const debouncedRefreshAll = debounce(() => {
  supastashEventBus.emit(`refresh:all`);
}, 1000);

/**
 * Refreshes all tables
 * Use this when you want to update data to UI
 */
export function refreshAllTables() {
  debouncedRefreshAll();
}

/**
 * Debounces a function
 * @param func - The function to debounce
 * @param wait - The time to wait before calling the function
 * @returns The debounced function
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function (this: any, ...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}
