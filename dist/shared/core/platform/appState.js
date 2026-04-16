export class AppStateService {
    constructor(adapter) {
        this.adapter = adapter;
    }
    onActive(cb) {
        return this.adapter.subscribe((state) => {
            if (state === "active")
                cb();
        });
    }
}
