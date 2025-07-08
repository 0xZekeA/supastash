import { SupastashHookReturn } from "../types/supastashConfig.types";
/**
 * React hook to initialize and manage Supastash.
 *
 * Responsibilities:
 * - Initializes the Supastash client.
 * - Sets up the SQLite database.
 * - Creates internal sync status tables.
 * - Invokes the user-defined schema initializer (if provided).
 * - Starts the sync engine once the DB is ready.
 *
 * @returns {{
 *   dbReady: boolean,
 *   startSync: () => void,
 *   stopSync: () => void
 * }} Object containing the DB readiness state and sync control functions.
 */
export declare function useSupastash(lazy?: boolean): SupastashHookReturn;
//# sourceMappingURL=supastashLogic.d.ts.map