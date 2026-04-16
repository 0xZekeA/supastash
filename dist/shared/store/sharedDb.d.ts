import { SupastashSQLiteDatabase } from "../types/supastashConfig.types";
export declare function initializeSharedDb(db: SupastashSQLiteDatabase): void;
export declare function setCloseDbCallback(callback: (() => Promise<void>) | null): void;
export declare function getSharedDb(): SupastashSQLiteDatabase;
export declare function closeSharedDb(): Promise<void>;
//# sourceMappingURL=sharedDb.d.ts.map