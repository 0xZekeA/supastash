export type AppStateStatus = "active" | "background";
type Callback = (state: AppStateStatus) => void;
export interface AppStateAdapter {
    subscribe(cb: Callback): () => void;
}
export declare class AppStateService {
    private adapter;
    constructor(adapter: AppStateAdapter);
    onActive(cb: () => void): () => void;
}
export {};
//# sourceMappingURL=appState.d.ts.map