import deepEqual from "fast-deep-equal";
import { localCache } from "../../store/localCache";
const subscribers = new Map();
export function subscribe(table, cb) {
    if (!subscribers.has(table))
        subscribers.set(table, new Set());
    subscribers.get(table).add(cb);
    return () => {
        subscribers.get(table)?.delete(cb);
    };
}
export function notifySubscribers(table) {
    subscribers.get(table)?.forEach((cb) => cb());
}
const snapshotCache = new Map();
export function getSnapshot(table) {
    const latest = localCache.get(table);
    if (!latest) {
        if (!snapshotCache.has(table)) {
            const emptySnapshot = {
                data: [],
                dataMap: new Map(),
                groupedBy: {},
            };
            snapshotCache.set(table, emptySnapshot);
        }
        return snapshotCache.get(table);
    }
    const prev = snapshotCache.get(table);
    if (deepEqual(prev, latest))
        return prev;
    snapshotCache.set(table, latest);
    return latest;
}
