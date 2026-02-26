import { SupastashFilter } from "../../../types/realtimeData.types";
import { PublicScope, SupastashSyncStatus } from "../../../types/syncEngine.types";
/**
 * Gets the supastash sync status for a given table and filters
 * @param table - The name of the table to get the sync status for
 * @param filters - The filters to apply to the sync status
 * @returns The supastash sync status
 */
export declare function getSupastashSyncStatus(table: string, filters?: SupastashFilter[]): Promise<SupastashSyncStatus | null>;
export declare function setSupastashSyncStatus(table: string, filters: SupastashFilter[] | undefined, opts: {
    lastSyncedAt?: string | null;
    lastDeletedAt?: string | null;
    lastSyncedAtPk?: string | null;
    filterNamespace?: string;
}): Promise<void>;
/**
 * Resets the supastash sync status for a given table and filters
 * @param table - The name of the table to reset the sync status for
 * @param filters - The filters to apply to the sync status
 * @param scope - The scope to reset the sync status for
 * @returns The supastash sync status
 */
export declare function resetSupastashSyncStatus(table: string, filters: SupastashFilter[] | undefined, scope?: PublicScope): Promise<void>;
/**
 * Clears the supastash sync status for a given table and filters
 * @param table - The name of the table to clear the sync status for
 * @param filters - The filters to apply to the sync status
 * @returns The supastash sync status
 */
export declare function clearSupastashSyncStatus(table: string, filters?: SupastashFilter[]): Promise<void>;
//# sourceMappingURL=services.d.ts.map