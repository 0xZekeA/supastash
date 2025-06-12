import { PayloadListResult, PayloadResult, SyncMode } from "../../../types/query.types";
/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export declare function upsertData<T extends boolean, R>(table: string, payload: R | R[] | null, syncMode?: SyncMode, isSingle?: T): Promise<T extends true ? PayloadResult<R> : PayloadListResult<R>>;
//# sourceMappingURL=upsert.d.ts.map