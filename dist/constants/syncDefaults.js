export const DEFAULT_POLICY = {
    nonRetryableCodes: new Set(["23505", "23502", "23514", "23P01"]),
    retryableCodes: new Set(["40001", "40P01", "55P03"]),
    fkCode: "23503",
    onNonRetryable: "accept-server",
    maxTransientMs: 20 * 60 * 1000, // 20m
    maxFkBlockMs: 24 * 60 * 60 * 1000, // 24h
    backoffDelaysMs: [10000, 30000, 120000, 300000, 600000],
    maxBatchAttempts: 5,
};
export const DEFAULT_FIELDS = {
    requireCreatedAt: true,
    requireUpdatedAt: true,
    createdAtField: "created_at",
    updatedAtField: "updated_at",
    autoFillMissing: true,
    autoFillDefaultISO: "1970-01-01T00:00:00Z",
};
export const DEFAULT_CHUNK_SIZE = 500;
