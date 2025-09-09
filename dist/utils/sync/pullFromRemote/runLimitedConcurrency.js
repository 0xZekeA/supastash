import { logWarn } from "../../../utils/logs";
export async function runLimitedConcurrency(tasks, n, opts) {
    const total = tasks.length;
    if (!total || n <= 0)
        return { done: 0, failed: 0, total };
    const queue = tasks.slice();
    let done = 0, failed = 0, idx = 0;
    const workers = Array.from({ length: Math.min(n, queue.length) }, async () => {
        await Promise.resolve();
        while (queue.length) {
            const job = queue.shift();
            const jobIndex = idx++;
            if (!job)
                break;
            try {
                await job();
            }
            catch (e) {
                failed++;
                logWarn("[Supastash] job failed", { e: String(e) });
                opts?.onError?.(e, jobIndex);
            }
            finally {
                done++;
                opts?.onProgress?.(done, total);
                if (done % 50 === 0)
                    await new Promise((r) => setTimeout(r, 0));
            }
        }
    });
    await Promise.all(workers);
    return { done, failed, total };
}
