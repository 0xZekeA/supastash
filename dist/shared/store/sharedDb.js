let db = null;
let closeDbCallback = null;
export function initializeSharedDb(db) {
    db = db;
}
export function setCloseDbCallback(callback) {
    closeDbCallback = callback;
}
export function getSharedDb() {
    if (!db) {
        throw new Error("[Supastash] Shared database not initialized. Please initialize the database first with the `setupSupastashDb` function at the top of your config or layout file.");
    }
    return db;
}
export async function closeSharedDb() {
    await closeDbCallback?.();
}
