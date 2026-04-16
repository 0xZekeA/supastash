export declare function runLimitedConcurrency(tasks: Array<() => Promise<any>>, n: number, opts?: {
    onError?: (err: any, index: number) => void;
    onProgress?: (done: number, total: number) => void;
}): Promise<{
    done: number;
    failed: number;
    total: number;
}>;
//# sourceMappingURL=runLimitedConcurrency.d.ts.map