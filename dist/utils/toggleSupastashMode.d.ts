import { SupastashMode } from "../types/supastashConfig.types";
/**
 * Reinitializes Supastash in a different runtime mode.
 *
 * This performs a full, deterministic teardown and re-startup of Supastash
 * to safely transition between execution modes (e.g. "live" ↔ "ghost").
 *
 * Lifecycle guarantees:
 * 1. All active sync loops are stopped.
 * 2. All realtime subscriptions are unsubscribed.
 * 3. The Supastash configuration is updated with the new mode.
 * 4. The active local database connection is closed.
 * 5. A new database connection is opened using the resolved mode-specific database.
 * 6. Sync and realtime systems are restarted only when entering "live" mode.
 *
 * Important invariants:
 * - Mode switching is NOT supported at runtime without reinitialization.
 * - Ghost Mode guarantees zero network activity:
 *   no sync, no realtime, no background jobs, and no server access.
 * - Data written in Ghost Mode is fully isolated and never synchronized.
 *
 * This function must be the ONLY supported way to change Supastash modes.
 * Direct mutation of the Supastash configuration is unsafe and unsupported.
 *
 * @param mode The target Supastash runtime mode.
 */
export declare function reinitializeSupastash(mode: SupastashMode): Promise<void>;
//# sourceMappingURL=toggleSupastashMode.d.ts.map