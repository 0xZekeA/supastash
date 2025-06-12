import { PayloadData } from "../../../types/query.types";
/**
 * Deletes a chunk of data from the remote database
 * @param table - The table to delete from
 * @param unsyncedRecords - The unsynced records to delete
 */
export declare function deleteData(table: string, unsyncedRecords: PayloadData[]): Promise<void>;
//# sourceMappingURL=deleteChunks.d.ts.map