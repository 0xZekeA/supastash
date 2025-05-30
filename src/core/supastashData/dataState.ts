import { PayloadData } from "@/types/query.types";
import { useState } from "react";

function useDataState() {
  const [version, setVersion] = useState(0);
  const [dataMap, setDataMap] = useState<Map<string, PayloadData>>(new Map());
  return { dataMap, setDataMap, version, setVersion };
}

export default useDataState;
