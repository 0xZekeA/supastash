import { RealtimeFilter } from "../../../types/realtimeData.types";
import { SupastashSQLiteDatabase } from "../../../types/supastashConfig.types";
import { SupastashSyncStatus } from "../../../types/syncEngine.types";
export declare function ensureSyncMarksTable(db: SupastashSQLiteDatabase): Promise<void>;
export declare function selectMarks(db: SupastashSQLiteDatabase, table: string, filterKey: string): Promise<SupastashSyncStatus | null>;
export declare function selectAndAddAMillisecond(db: SupastashSQLiteDatabase, table: string, tableFilters?: RealtimeFilter[]): Promise<SupastashSyncStatus>;
export declare function upsertMarks(db: SupastashSQLiteDatabase, row: Partial<SupastashSyncStatus>): Promise<void>;
export declare function resetColumn(db: SupastashSQLiteDatabase, table: string, filterKey: string, col: "last_synced_at" | "last_created_at" | "last_deleted_at", value: string, filterJson: string): Promise<void>;
export declare function deleteMarks(db: SupastashSQLiteDatabase, table: string, filterKey?: string): Promise<void>;
//# sourceMappingURL=repo.d.ts.map