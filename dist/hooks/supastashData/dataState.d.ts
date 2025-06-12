declare function useDataState<R = any>(table: string): {
    dataMap: Map<string, R>;
    setDataMap: import("react").Dispatch<import("react").SetStateAction<Map<string, R>>>;
    version: string;
    setVersion: import("react").Dispatch<import("react").SetStateAction<string>>;
};
export default useDataState;
//# sourceMappingURL=dataState.d.ts.map