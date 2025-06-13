import { PayloadListResult, PayloadResult, SyncMode } from "../../../types/query.types";
/**
 * Inserts data locally, sets synced_at to null pending update to remote server
 *
 * @param table - The name of the table to insert into
 * @param payload - The payload to insert
 * @returns a data / error object
 */
export declare function insertData<T extends boolean, R, Z>(table: string, payload: R[] | null, syncMode?: SyncMode, isSingle?: T): Promise<T extends true ? PayloadResult<Z> : PayloadListResult<Z>>;
//# sourceMappingURL=insert.d.ts.map