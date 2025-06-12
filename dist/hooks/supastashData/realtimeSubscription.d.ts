import { PayloadData } from "../../types/query.types";
import { RealtimeOptions, RealtimeStatus } from "../../types/realtimeData.types";
declare function useRealtimeSubscription(table: string, queueHandler: (eventType: string, data: PayloadData) => void, options: RealtimeOptions, initialized: boolean, realtime: boolean): RealtimeStatus;
export default useRealtimeSubscription;
//# sourceMappingURL=realtimeSubscription.d.ts.map