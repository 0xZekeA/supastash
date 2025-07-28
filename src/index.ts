export { configureSupastash, getSupastashConfig } from "./core/config";
export { defineLocalSchema } from "./core/schemaManager";
export { getSupastashDb } from "./db/dbInitializer";
export { useSupastashData } from "./hooks/supastashData";
//export { useSupastashLiteQuery } from "./hooks/supastashLiteQuery";
export { useSupastash } from "./hooks/supastashLogic";
export { syncAllTables, syncTable } from "./hooks/syncEngine";
export { supastashEventBus } from "./utils/events/eventBus";
export { supastash } from "./utils/query/builder";
export {
  dropAllTables,
  dropTable,
  wipeAllTables,
  wipeOldDataForAllTables,
  wipeOldDataForATable,
  wipeTable,
} from "./utils/schema/wipeTables";
export { getAllTables } from "./utils/sync/getAllTables";
export {
  refreshAllTables,
  refreshTable,
  refreshTableWithPayload,
} from "./utils/sync/refreshTables";
export {
  clearAllLocalDeleteLog,
  clearAllLocalSyncLog,
  clearLocalDeleteLog,
  clearLocalSyncLog,
  getLocalDeleteLog,
  getLocalSyncLog,
  setLocalDeleteLog,
  setLocalSyncLog,
} from "./utils/syncStatus";

export type { CrudMethods } from "./types/query.types";
export type {
  RealtimeOptions,
  SupastashDataResult,
  SupastashFilter,
} from "./types/realtimeData.types";
export type {
  SupastashConfig,
  SupastashHookReturn,
  SupastashSQLiteClientTypes,
  SupastashSQLiteDatabase,
} from "./types/supastashConfig.types";
