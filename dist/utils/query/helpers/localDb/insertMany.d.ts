import { SyncMode } from "../../../../types/query.types";
import { SupastashSQLiteExecutor } from "../../../../types/supastashConfig.types";
interface InsertOptions<R = any> {
    table: string;
    syncMode?: SyncMode;
    nowISO?: string;
    returnInsertedRows?: boolean;
    withTx: boolean;
    tx: SupastashSQLiteExecutor | null;
}
export declare function insertMany<R = any>(payload: R[], opts: InsertOptions<R>): Promise<R[] | void>;
export {};
//# sourceMappingURL=insertMany.d.ts.map