/**
 * Create a single-column index on "id" where it actually helps.
 * - Skips virtual tables (e.g. FTS), views, system tables.
 * - Skips when "id" doesn't exist.
 * - Skips when "id" is already PK (including TEXT PK which has an implicit unique index).
 * - Skips when there's already an index on "id".
 */
export declare function createIdIndexes(): Promise<void>;
//# sourceMappingURL=createIndexes.d.ts.map