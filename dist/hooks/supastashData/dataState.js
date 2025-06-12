import { useState } from "react";
function useDataState(table) {
    const [version, setVersion] = useState(`${table}-${Date.now()}`);
    const [dataMap, setDataMap] = useState(new Map());
    return { dataMap, setDataMap, version, setVersion };
}
export default useDataState;
