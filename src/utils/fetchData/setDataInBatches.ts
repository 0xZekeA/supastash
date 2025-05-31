import { PayloadData } from "@/types/query.types";

export function setDataMapInBatches(
  map: Map<string, PayloadData>,
  update: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>
) {
  const entries = Array.from(map.entries());
  const batchSize = 200;
  let index = 0;

  function nextBatch() {
    const batch = entries.slice(index, index + batchSize);
    if (batch.length === 0) return;
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
