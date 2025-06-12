export function setDataMapInBatches(map, update) {
    const entries = Array.from(map.entries());
    const batchSize = 200;
    let index = 0;
    function nextBatch() {
        const batch = entries.slice(index, index + batchSize);
        if (batch.length === 0)
            return;
        update((prev) => {
            const newMap = new Map(prev);
            for (const [key, val] of batch) {
                newMap.set(key, val);
            }
            return newMap;
        });
        index += batchSize;
        requestIdleCallback(nextBatch);
    }
    nextBatch();
}
