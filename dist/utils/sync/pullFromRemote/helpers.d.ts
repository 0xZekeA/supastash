import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
export declare function pageThrough(base: {
    tsCol: "created_at" | "updated_at" | "deleted_at";
    since: string;
    table: string;
    select?: string;
    filters?: RealtimeFilter[];
    includeDeleted?: boolean;
}): Promise<any[]>;
export declare function getMaxDate(rows: PayloadData[], col: "created_at" | "updated_at" | "deleted_at"): string | null;
export declare function logNoUpdates(table: string): void;
//# sourceMappingURL=helpers.d.ts.map