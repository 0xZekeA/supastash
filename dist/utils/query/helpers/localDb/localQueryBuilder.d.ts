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
export declare function buildSelect<T extends boolean>(table: string, select: string | null, filters: FilterCalls[] | null, limit: number | null, isSingle: T): () => Promise<T extends true ? import("../../../../types/query.types").SupastashResult<any> : import("../../../../types/query.types").SupastashResult<any[]>>;
/**
 * Builds an insert query
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns query
 */
export declare function buildInsert<T extends boolean, R>(table: string, payload: R | R[] | null, syncMode?: SyncMode, isSingle?: T): () => Promise<T extends true ? import("../../../../types/query.types").PayloadResult<R> : import("../../../../types/query.types").PayloadListResult<R>>;
/**
 * Builds an update query
 *
 * @returns query
 */
export declare function buildUpdate<R>(table: string, payload: R | null, filters: FilterCalls[] | null, syncMode?: SyncMode): () => Promise<import("../../../../types/query.types").PayloadListResult<R>>;
/**
 * Builds a delete query
 *
 * @returns query
 */
export declare function buildDelete(table: string, filters: FilterCalls[] | null, syncMode?: SyncMode): () => Promise<import("../../../../types/query.types").SupatashDeleteResult<any>>;
export declare function buildUpsert<T extends boolean, R>(table: string, payload: R | R[] | null, syncMode?: SyncMode, isSingle?: T): () => Promise<T extends true ? import("../../../../types/query.types").PayloadResult<R> : import("../../../../types/query.types").PayloadListResult<R>>;
//# sourceMappingURL=localQueryBuilder.d.ts.map