import { useCallback, useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../../utils/fetchData/snapShot";

function useDataState<R, T>(table: string) {
  const stableSubscribe = useCallback(
    (cb: () => void) => subscribe(table, cb),
    [table]
  );

  const getStableSnapshot = useCallback(() => getSnapshot(table), [table]);

  return useSyncExternalStore(stableSubscribe, getStableSnapshot) as {
    dataMap: Map<string, R>;
    data: Array<R>;
    groupedBy?: {
      [K in keyof T]: Map<T[K], Array<R>>;
    };
  };
}

export default useDataState;
