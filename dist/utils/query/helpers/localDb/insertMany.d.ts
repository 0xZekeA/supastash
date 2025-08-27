import { SyncMode } from "../../../../types/query.types";
interface InsertOptions<R = any> {
    table: string;
    syncMode?: SyncMode;
    nowISO?: string;
    returnInsertedRows?: boolean;
}
export declare function insertMany<R = any>(payload: R[], opts: InsertOptions<R>): Promise<R[] | void>;
export {};
//# sourceMappingURL=insertMany.d.ts.map