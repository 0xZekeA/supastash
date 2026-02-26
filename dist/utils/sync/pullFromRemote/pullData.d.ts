import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export declare function pullData({ table, filters, batchId, }: {
    table: string;
    filters?: SupastashFilter[];
    batchId: string;
}): Promise<{
    data: PayloadData[];
    deletedIds: string[];
    timestamps: {
        updatedMax: string | null;
        deletedMax: string | null;
        updatedMaxPk: string | null;
    };
} | null>;
//# sourceMappingURL=pullData.d.ts.map