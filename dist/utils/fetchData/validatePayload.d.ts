import { PayloadData } from "../../types/query.types";
import { TableSchema } from "../../types/realtimeData.types";
/**
 * Validates the payload
 * @param payload - The payload to validate
 */
export declare function validatePayload(payload: PayloadData): Promise<void>;
export declare function validatePayloadForTable(payload: TableSchema[]): void;
//# sourceMappingURL=validatePayload.d.ts.map