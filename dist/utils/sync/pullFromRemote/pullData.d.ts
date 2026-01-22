import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export declare function pullData(table: string, filters?: RealtimeFilter[]): Promise<{
    data: PayloadData[];
    deletedIds: string[];
    timestamps: {
        createdMax: string | null;
        updatedMax: string | null;
        deletedMax: string | null;
    };
} | null>;
//# sourceMappingURL=pullData.d.ts.map