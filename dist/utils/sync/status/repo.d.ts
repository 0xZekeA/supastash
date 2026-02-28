import { SupastashFilter } from "../../../types/realtimeData.types";
import { SupastashSQLiteDatabase } from "../../../types/supastashConfig.types";
import { SupastashSyncStatus } from "../../../types/syncEngine.types";
export declare function ensureSyncMarksTable(): Promise<void>;
export declare function selectMarks(db: SupastashSQLiteDatabase, table: string, filterKey: string): Promise<SupastashSyncStatus | null>;
export declare function selectSyncStatus(db: SupastashSQLiteDatabase, table: string, tableFilters?: SupastashFilter[]): Promise<SupastashSyncStatus>;
export declare function upsertMarks(db: SupastashSQLiteDatabase, row: Partial<SupastashSyncStatus>): Promise<any>;
export declare function resetColumn(db: SupastashSQLiteDatabase, table: string, filterKey: string, col: "last_synced_at" | "last_deleted_at", value: string, filterJson: string): Promise<any>;
export declare function deleteMarks(db: SupastashSQLiteDatabase, table: string, filterKey?: string): Promise<any>;
//# sourceMappingURL=repo.d.ts.map