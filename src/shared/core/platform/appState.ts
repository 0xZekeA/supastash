export type AppStateStatus = "active" | "background";

type Callback = (state: AppStateStatus) => void;

export interface AppStateAdapter {
  subscribe(cb: Callback): () => void;
}

export class AppStateService {
  private adapter: AppStateAdapter;

  constructor(adapter: AppStateAdapter) {
    this.adapter = adapter;
  }

  onActive(cb: () => void) {
    return this.adapter.subscribe((state) => {
      if (state === "active") cb();
    });
  }
}
