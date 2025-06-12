import { useState } from "react";

function useDataState<R = any>(table: string) {
  const [version, setVersion] = useState(`${table}-${Date.now()}`);
  const [dataMap, setDataMap] = useState<Map<string, R>>(new Map());
  return { dataMap, setDataMap, version, setVersion };
}

export default useDataState;
