import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import { ReceivedDataCompleted } from "../../../types/syncEngine.types";
export declare function pageThrough(base: {
    tsCol: "created_at" | "updated_at" | "deleted_at";
    since: string;
    table: string;
    select?: string;
    filters?: RealtimeFilter[];
    includeDeleted?: boolean;
    batchId: string;
    previousPk?: string | null;
}): Promise<any[]>;
export declare function returnMaxDate({ row, prevMax, col, }: {
    row: PayloadData;
    prevMax: {
        value: string;
        pk: string | null;
    } | null;
    col: "created_at" | "updated_at" | "deleted_at";
}): {
    value: string;
    pk: string | null;
} | null;
export declare function getMaxDate(rows: PayloadData[], col: "created_at" | "updated_at" | "deleted_at"): string | null;
export declare function logNoUpdates(table: string): void;
export declare function getReceivedDataCompleted({ batchId, col, }: {
    batchId: string;
    col: "created_at" | "updated_at" | "deleted_at";
}): ReceivedDataCompleted;
export declare function setReceivedDataCompleted({ batchId, col, completed, }: {
    batchId: string;
    col: "created_at" | "updated_at" | "deleted_at";
    completed: ReceivedDataCompleted;
}): void;
export declare function deleteReceivedDataCompleted(batchId: string): void;
//# sourceMappingURL=helpers.d.ts.map