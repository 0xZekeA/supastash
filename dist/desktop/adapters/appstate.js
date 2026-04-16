export const subscribeToAppVisibility = (cb) => {
    if (typeof document !== "undefined") {
        const handler = () => {
            if (document.visibilityState === "visible")
                cb();
        };
        document.addEventListener("visibilitychange", handler);
        return () => document.removeEventListener("visibilitychange", handler);
    }
};
