import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
/**
 * Pulls data from the remote database for a given table
 * @param table - The table to pull data from
 * @returns The data from the table
 */
export declare function pullData(table: string, filter?: RealtimeFilter): Promise<PayloadData[] | null>;
export declare function getMaxCreatedDate(data: PayloadData[]): string | null;
export declare function getMaxUpdatedDate(data: PayloadData[]): string | null;
//# sourceMappingURL=pullData.d.ts.map