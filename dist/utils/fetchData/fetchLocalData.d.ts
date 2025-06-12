import { PayloadData } from "../../types/query.types";
/**
 * Fetches the local data from the database
 * @param table - The name of the table to fetch from
 * @param setData - The function to set the data
 * @param shouldFetch - Whether to fetch the data
 */
export declare function fetchLocalData(table: string, setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>, setVersion: React.Dispatch<React.SetStateAction<string>>, shouldFetch?: boolean, limit?: number): Promise<void>;
//# sourceMappingURL=fetchLocalData.d.ts.map