import { FilterCalls, SyncMode } from "../../../../types/query.types";
/**
 * Builds a select query
 *
 * @param table - The name of the table to query
 * @param select - The columns to select
 * @param filters - The filters to apply
 * @param limit - The limit to apply
 * @param isSingle - Whether to return a single row or multiple rows
 * @returns query
 */
export declare function buildSelect<T extends boolean, R, Z>(table: string, select: string | null, filters: FilterCalls[] | null, limit: number | null, isSingle: T): () => Promise<T extends true ? import("../../../../types/query.types").PayloadResult<Z> : import("../../../../types/query.types").PayloadListResult<Z>>;
/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export declare function buildInsert<T extends boolean, R, Z>(table: string, payload: R | R[] | null, syncMode?: SyncMode, isSingle?: T): () => Promise<T extends true ? import("../../../../types/query.types").PayloadResult<Z> : import("../../../../types/query.types").PayloadListResult<Z>>;
/**
 * Builds an update query
 *
 * @returns query
 */
export declare function buildUpdate<T extends boolean, R, Z>(table: string, payload: R | null, filters: FilterCalls[] | null, syncMode?: SyncMode, isSingle?: T): () => Promise<T extends true ? import("../../../../types/query.types").PayloadResult<Z> : import("../../../../types/query.types").PayloadListResult<Z>>;
/**
 * Builds a delete query
 *
 * @returns query
 */
export declare function buildDelete<Z = any>(table: string, filters: FilterCalls[] | null, syncMode?: SyncMode): () => Promise<import("../../../../types/query.types").SupatashDeleteResult<Z>>;
export declare function buildUpsert<T extends boolean, R, Z>(table: string, payload: R | R[] | null, syncMode?: SyncMode, isSingle?: T, onConflictKeys?: string[]): () => Promise<T extends true ? import("../../../../types/query.types").PayloadResult<Z> : import("../../../../types/query.types").PayloadListResult<Z>>;
//# sourceMappingURL=localQueryBuilder.d.ts.map