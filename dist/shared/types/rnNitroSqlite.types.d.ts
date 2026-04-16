export interface RNNitroSQLiteDatabase {
  transaction(fn: (tx: Transaction) => Promise<void> | void): Promise<void>;
  execute: ExecuteQuery;
  executeAsync: ExecuteAsyncQuery;
  close(): Promise<void>;
}

enum ColumnType {
  BOOLEAN,
  NUMBER,
  INT64,
  TEXT,
  ARRAY_BUFFER,
  NULL_VALUE,
}

// Passing null/undefined in array types is not possible, so we us a special struct as a workaround.
type SQLiteNullValue = {
  isNitroSQLiteNull: true;
};
type SQLiteValue = boolean | number | string | ArrayBuffer | SQLiteNullValue;

/** Used internally to transform the query params into a native format without nullish values */
type NativeSQLiteQueryParams = SQLiteValue[];

/**
 * Represents a value that can be stored in a SQLite database
 */
type SQLiteQueryParamItem = SQLiteValue | null | undefined;
type SQLiteQueryParams = SQLiteQueryParamItem[];

type QueryResultRowItem = SQLiteValue | undefined;
type QueryResultRow = Record<string, QueryResultRowItem>;
interface QueryResult<Row extends QueryResultRow = QueryResultRow> {
  readonly insertId?: number;
  readonly rowsAffected: number;

  readonly rows?: {
    /** Raw array with all dataset */
    _array: Row[];
    /** The lengh of the dataset */
    length: number;
    /** A convenience function to acess the index based the row object
     * @param idx the row index
     * @returns the row structure identified by column names
     */
    item: (idx: number) => Row | undefined;
  };
}

type ExecuteQuery = <Row extends QueryResultRow = QueryResultRow>(
  query: string,
  params?: SQLiteQueryParams
) => QueryResult<Row>;

type ExecuteAsyncQuery = <Row extends QueryResultRow = QueryResultRow>(
  query: string,
  params?: SQLiteQueryParams
) => Promise<QueryResult<Row>>;

interface Transaction {
  commit(): QueryResult;
  rollback(): QueryResult;
  execute: ExecuteQuery;
  executeAsync: ExecuteAsyncQuery;
}

/**
 * Allows the execution of bulk of sql commands
 * inside a transaction
 * If a single query must be executed many times with different arguments, its preferred
 * to declare it a single time, and use an array of array parameters.
 */
interface BatchQueryCommand {
  query: string;
  params?: SQLiteQueryParams | SQLiteQueryParams[];
}

/**
 * Used internally to transform the batch query commands into a native format without nullish values
 */
interface NativeBatchQueryCommand {
  query: string;
  params?: NativeSQLiteQueryParams | NativeSQLiteQueryParams[];
}

/**
 * status: 0 or undefined for correct execution, 1 for error
 * message: if status === 1, here you will find error description
 * rowsAffected: Number of affected rows if status == 0
 */
interface BatchQueryResult {
  rowsAffected?: number;
}

/**
 * Result of loading a file and executing every line as a SQL command
 * Similar to BatchQueryResult
 */
interface FileLoadResult extends BatchQueryResult {
  commands?: number;
}
