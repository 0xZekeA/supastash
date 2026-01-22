export interface ExpoSQLiteDatabase {
  runAsync<T = any>(
    statement: string,
    params: SQLiteBindParams
  ): Promise<SQLiteRunResult>;
  runAsync<T = any>(
    statement: string,
    ...params: SQLiteVariadicBindParams
  ): Promise<SQLiteRunResult>;

  getFirstAsync<T = any>(
    statement: string,
    params: SQLiteBindParams
  ): Promise<T | null>;
  getFirstAsync<T = any>(
    statement: string,
    ...params: SQLiteVariadicBindParams
  ): Promise<T | null>;

  getAllAsync<T = any>(
    statement: string,
    params: SQLiteBindParams
  ): Promise<T[]>;
  getAllAsync<T = any>(
    statement: string,
    ...params: SQLiteVariadicBindParams
  ): Promise<T[]>;

  execAsync(statement: string): Promise<void>;
  closeAsync(): Promise<void>;
}

export type SQLiteBindValue = string | number | null | boolean | Uint8Array;
export type SQLiteBindParams =
  | Record<string, SQLiteBindValue>
  | SQLiteBindValue[];
export type SQLiteVariadicBindParams = SQLiteBindValue[];

export type SQLiteBindPrimitiveParams = Record<
  string,
  Exclude<SQLiteBindValue, Uint8Array>
>;
export type SQLiteBindBlobParams = Record<string, Uint8Array>;
export type SQLiteColumnNames = string[];
export type SQLiteColumnValues = any[];
export type SQLiteAnyDatabase = any;

export interface SQLiteRunResult {
  /**
   * The last inserted row ID. Returned from the [`sqlite3_last_insert_rowid()`](https://www.sqlite.org/c3ref/last_insert_rowid.html) function.
   */
  lastInsertRowId: number;

  /**
   * The number of rows affected. Returned from the [`sqlite3_changes()`](https://www.sqlite.org/c3ref/changes.html) function.
   */
  changes: number;
}
