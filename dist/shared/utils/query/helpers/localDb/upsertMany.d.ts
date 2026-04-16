import { CrudMethods, SupastashQuery, SyncMode } from "../../../../types/query.types";
import { SupastashSQLiteExecutor } from "../../../../types/supastashConfig.types";
interface UpsertOptions<R = any> {
    table: string;
    onConflictKeys?: string[];
    syncMode?: SyncMode;
    nowISO?: string;
    preserveTimestamp?: boolean;
    returnRows?: boolean;
    yieldEvery?: number;
    withTx: boolean;
    tx: SupastashSQLiteExecutor | null;
}
export declare function upsertMany<R = any>(items: R[], opts: UpsertOptions<R>, state: SupastashQuery<CrudMethods, boolean, R>): Promise<R[] | void>;
export {};
//# sourceMappingURL=upsertMany.d.ts.map