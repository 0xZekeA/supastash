import { PayloadListResult, PayloadResult, SyncMode } from "../../../types/query.types";
/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export declare function upsertData<T extends boolean, R, Z>(table: string, payload: R | R[] | null, syncMode?: SyncMode, isSingle?: T, onConflictKeys?: string[], preserveTimestamp?: boolean): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>>;
//# sourceMappingURL=upsert.d.ts.map