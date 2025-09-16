import { SupastashConfig } from "../../../types/supastashConfig.types";
import { RowLike } from "../../../types/syncEngine.types";
export declare function classifyFailure(cfg: SupastashConfig<any>, code?: string | number): "HTTP" | "UNKNOWN" | "NON_RETRYABLE" | "FK_BLOCK" | "RETRYABLE";
declare function batchUpsert(table: string, rows: RowLike[], supabase: any): Promise<any>;
declare function singleUpsert(table: string, row: RowLike, supabase: any): Promise<any>;
declare function markSynced(table: string, ids: string[]): Promise<void>;
declare function filterRowsByUpdatedAt(table: string, chunk: RowLike[], remoteHeads: Map<string, string>): RowLike[];
declare function handleRowFailure(cfg: SupastashConfig<any>, table: string, row: RowLike, err: any, supabase: any): Promise<"DROP" | "KEEP" | "REPLACED">;
export { batchUpsert, filterRowsByUpdatedAt, handleRowFailure, markSynced, singleUpsert, };
/**
 * Deletes local row and rewinds table watermark so normal pull will fetch server copy.
 * No server read needed.
 */
export declare function rewindAndDropLocal(table: string, rowId: string): Promise<void>;
export declare function fetchRemoteHeadsChunked(table: string, ids: string[], supabase: any): Promise<Map<string, string>>;
//# sourceMappingURL=uploadHelpers.d.ts.map