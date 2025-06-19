import { useCallback, useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../../utils/fetchData/snapShot";
function useDataState(table) {
    const stableSubscribe = useCallback((cb) => subscribe(table, cb), [table]);
    const getStableSnapshot = useCallback(() => getSnapshot(table), [table]);
    return useSyncExternalStore(stableSubscribe, getStableSnapshot);
}
export default useDataState;
