import { RealtimeOptions } from "../../types/realtimeData.types";
export declare function fetchCalls<R>(table: string, options: RealtimeOptions<R>, initialized: React.RefObject<boolean>): {
    triggerRefresh: () => Promise<void>;
    trigger: () => void;
    cancel: () => void;
    initialFetchAndSync: () => Promise<void>;
};
//# sourceMappingURL=fetchCalls.d.ts.map