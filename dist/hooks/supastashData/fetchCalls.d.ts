import { RealtimeOptions } from "../../types/realtimeData.types";
export declare function fetchCalls(table: string, setDataMap: React.Dispatch<React.SetStateAction<Map<string, any>>>, setVersion: React.Dispatch<React.SetStateAction<string>>, options: RealtimeOptions, initialized: React.RefObject<boolean>): {
    triggerRefresh: () => Promise<void>;
    trigger: () => void;
    cancel: () => void;
    initialFetchAndSync: () => Promise<void>;
    pushToUI: (payload: any | any[], operation: "insert" | "update" | "delete" | "upsert") => Promise<void>;
};
//# sourceMappingURL=fetchCalls.d.ts.map