declare function useDataState<R, T>(table: string): {
    dataMap: Map<string, R>;
    data: Array<R>;
    groupedBy?: { [K in keyof T]: Map<T[K], Array<R>>; };
};
export default useDataState;
//# sourceMappingURL=dataState.d.ts.map