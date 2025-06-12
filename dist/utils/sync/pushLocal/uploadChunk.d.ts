import { PayloadData } from "../../../types/query.types";
/**
 * Uploads a chunk of data to the remote database
 * @param table - The table to upload to
 * @param unsyncedRecords - The unsynced records to upload
 */
export declare function uploadData(table: string, unsyncedRecords: PayloadData[], onPushToRemote?: (payload: any[]) => Promise<boolean>): Promise<void>;
//# sourceMappingURL=uploadChunk.d.ts.map