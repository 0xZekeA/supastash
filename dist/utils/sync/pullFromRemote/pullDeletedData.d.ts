import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
/**
 * Pulls deleted data from the remote database for a given table
 * @param table - The table to pull deleted data from
 * @returns The deleted data from the table as a map of id to record and the reordered data
 */
export declare function pullDeletedData(table: string, filters?: RealtimeFilter[]): Promise<{
    deletedDataMap: Map<string, PayloadData>;
    records: PayloadData[];
} | null>;
//# sourceMappingURL=pullDeletedData.d.ts.map