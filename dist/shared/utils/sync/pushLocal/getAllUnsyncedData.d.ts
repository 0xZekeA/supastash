import { PayloadData } from "../../../types/query.types";
/**
 * Gets all unsynced data from a table
 * @param table - The table to get the data from
 * @returns The unsynced data
 */
export declare function getAllUnsyncedData(table: string): Promise<PayloadData[] | null>;
/**
 * Gets all deleted data from a table
 * @param table - The table to get the data from
 * @returns The deleted data
 */
export declare function getAllDeletedData(table: string): Promise<PayloadData[] | null>;
//# sourceMappingURL=getAllUnsyncedData.d.ts.map