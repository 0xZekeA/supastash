import { PayloadData } from "../../types/query.types";
import { RealtimeOptions } from "../../types/realtimeData.types";
declare const useRealtimeData: (table: string, queueHandler: (eventType: string, data: PayloadData) => void, options: RealtimeOptions, initialized: boolean, realtime: boolean) => void;
export default useRealtimeData;
//# sourceMappingURL=realTimeCall.d.ts.map