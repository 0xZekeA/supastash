interface ResultSet {
  insertId: number;
  rowsAffected: number;
  rows: ResultSetRowList;
}

interface ResultSetRowList {
  length: number;
  raw(): any[];
  item(index: number): any;
}

enum SQLErrors {
  UNKNOWN_ERR = 0,
  DATABASE_ERR = 1,
  VERSION_ERR = 2,
  TOO_LARGE_ERR = 3,
  QUOTA_ERR = 4,
  SYNTAX_ERR = 5,
  CONSTRAINT_ERR = 6,
  TIMEOUT_ERR = 7,
}

interface SQLError {
  code: number;
  message: string;
}

type StatementCallback = (
  transaction: Transaction,
  resultSet: ResultSet
) => void;
type StatementErrorCallback = (
  transaction: Transaction,
  error: SQLError
) => void;
interface Transaction {
  executeSql(
    sqlStatement: string,
    arguments?: any[]
  ): Promise<[Transaction, ResultSet]>;
  executeSql(
    sqlStatement: string,
    arguments?: any[],
    callback?: StatementCallback,
    errorCallback?: StatementErrorCallback
  ): void;
}

type TransactionCallback = (transaction: Transaction) => void;
type TransactionErrorCallback = (error: SQLError) => void;

export interface RNStorageSQLiteDatabase {
  close(): Promise<void>;
  transaction(scope: (tx: Transaction) => void): Promise<Transaction>;
  transaction(
    scope: (tx: Transaction) => void,
    error?: TransactionErrorCallback,
    success?: TransactionCallback
  ): void;
  executeSql(statement: string, params?: any[]): Promise<[ResultSet]>;
  executeSql(
    statement: string,
    params?: any[],
    success?: StatementCallback,
    error?: StatementErrorCallback
  ): void;
}
