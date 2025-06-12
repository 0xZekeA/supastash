import { PayloadData } from "../../types/query.types";
import { RealtimeOptions } from "../../types/realtimeData.types";
declare function useEventQueues(table: string, setDataMap: React.Dispatch<React.SetStateAction<Map<string, any>>>, setVersion: React.Dispatch<React.SetStateAction<string>>, options: RealtimeOptions, flushIntervalMs: number): (eventType: string, data: PayloadData) => void;
export default useEventQueues;
//# sourceMappingURL=eventQueues.d.ts.map