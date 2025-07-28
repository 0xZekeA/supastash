export function fetchReducer(state, action) {
    switch (action.type) {
        case "LOAD_START":
            return {
                ...state,
                isLoading: !action.isLoadMore && !action.isRefresh,
                isLoadingMore: !!action.isLoadMore,
                isRefreshing: !!action.isRefresh,
                error: null,
                requestId: state.requestId + 1,
            };
        case "LOAD_SUCCESS":
            return {
                ...state,
                data: action.payload.data,
                dataMap: action.payload.dataMap,
                groupedBy: action.payload.groupedBy,
                hasMore: action.payload.hasMore,
                cursor: action.payload.cursor,
                snapshotTime: state.snapshotTime || new Date().toISOString(),
                lastFetch: Date.now(),
                isLoading: false,
                error: null,
            };
        case "LOAD_MORE_SUCCESS":
            return {
                ...state,
                data: [...state.data, ...action.payload.data],
                dataMap: new Map([...state.dataMap, ...action.payload.dataMap]),
                groupedBy: mergeGroupedBy(state.groupedBy, action.payload.groupedBy),
                hasMore: action.payload.hasMore,
                cursor: action.payload.cursor,
                lastFetch: Date.now(),
                isLoadingMore: false,
                error: null,
            };
        case "REFRESH_SUCCESS":
            return {
                ...state,
                data: action.payload.data,
                dataMap: action.payload.dataMap,
                groupedBy: action.payload.groupedBy,
                hasMore: action.payload.hasMore,
                cursor: action.payload.cursor,
                snapshotTime: new Date().toISOString(), // New snapshot on refresh
                lastFetch: Date.now(),
                isRefreshing: false,
                error: null,
            };
        case "LOAD_ERROR":
            return {
                ...state,
                isLoading: false,
                isLoadingMore: false,
                isRefreshing: false,
                error: action.error,
            };
        case "RESET":
            return {
                ...state,
                data: [],
                dataMap: new Map(),
                groupedBy: undefined,
                hasMore: true,
                cursor: null,
                snapshotTime: null,
                error: null,
            };
        case "SET_FILTERS":
            return {
                ...state,
                filterClause: action.filterClause,
            };
        case "INVALIDATE_CACHE":
            return {
                ...state,
                lastFetch: 0, // Force refetch
            };
        default:
            return state;
    }
}
function mergeGroupedBy(existing, incoming) {
    if (!existing && !incoming)
        return undefined;
    if (!existing)
        return incoming;
    if (!incoming)
        return existing;
    const merged = { ...existing };
    for (const key in incoming) {
        if (!merged[key]) {
            merged[key] = new Map(incoming[key]);
        }
        else {
            for (const [groupKey, items] of incoming[key]) {
                const existingItems = merged[key].get(groupKey) || [];
                merged[key].set(groupKey, [...existingItems, ...items]);
            }
        }
    }
    return merged;
}
