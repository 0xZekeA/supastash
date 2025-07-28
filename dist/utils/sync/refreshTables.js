import { supastashEventBus } from "../events/eventBus";
import { refreshScreen } from "../refreshScreenCalls";
const debouncedTableEmitters = new Map();
/**
 * Refreshes a single table
 * Use this when you want to update data to UI
 * @param table - The name of the table to refresh
 */
export function refreshTable(table) {
    if (!debouncedTableEmitters.has(table)) {
        const fn = debounce(() => {
            refreshScreen(table);
        }, 100);
        debouncedTableEmitters.set(table, fn);
    }
    debouncedTableEmitters.get(table)();
}
const debouncedRefreshAll = debounce(() => {
    supastashEventBus.emit(`refresh:all`);
    supastashEventBus.emit(`liteQueryRefresh:all`);
}, 1000);
/**
 * Refreshes all tables
 * Use this when you want to update data to UI
 */
export function refreshAllTables() {
    debouncedRefreshAll();
}
/**
 * Refreshes a single table with a payload
 * Use this when you want to update data to UI
 * Must be the whole payload, not just the changes
 * @param table - The name of the table to refresh
 * @param payload - The payload to refresh the table with
 * @param operation - The operation to perform on the table
 * @deprecated Use refreshTable instead
 */
export function refreshTableWithPayload(table, payload, operation) {
    refreshScreen(table);
}
/**
 * Debounces a function
 * @param func - The function to debounce
 * @param wait - The time to wait before calling the function
 * @returns The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
