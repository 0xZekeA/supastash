import { PayloadData } from "../../types/query.types";
import { RealtimeOptions } from "../../types/realtimeData.types";
declare function useEventQueues<R>(table: string, options: RealtimeOptions<R>, flushIntervalMs: number): (eventType: string, data: PayloadData) => void;
export default useEventQueues;
//# sourceMappingURL=eventQueues.d.ts.map