import { CrudMethods, PayloadListResult, PayloadResult, SupastashQuery } from "../../../types/query.types";
/**
 * Performs upsert-like logic on local DB:
 * - If a row with the same ID exists, it is updated.
 * - Otherwise, it is inserted.
 * Returns all the rows that were upserted.
 */
export declare function upsertData<T extends boolean, R, Z>(state: SupastashQuery<CrudMethods, boolean, R>): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>>;
//# sourceMappingURL=upsert.d.ts.map