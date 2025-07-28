type SqlPrimitive =
  | "TEXT"
  | "INTEGER"
  | "REAL"
  | "BLOB"
  | "NUMERIC"
  | `NUMERIC(${number},${number})`
  | string;

type SqlModifier =
  | "PRIMARY KEY"
  | "NOT NULL"
  | "UNIQUE"
  | "DEFAULT"
  | "CHECK"
  | "COLLATE"
  | "REFERENCES"
  | "AUTOINCREMENT"
  | "ON CONFLICT"
  | "GENERATED ALWAYS"
  | "AS"
  | "STORED"
  | "VIRTUAL"
  | "NULL"
  | "CURRENT_TIMESTAMP"
  | "CURRENT_DATE"
  | "CURRENT_TIME"
  | "IF NOT EXISTS"
  | "WITHOUT ROWID"
  | string;

type ColumnDefinition = `${SqlPrimitive}${
  | ""
  | ` ${SqlModifier}`
  | ` ${SqlModifier} ${SqlModifier}`
  | ` ${SqlModifier} ${SqlModifier} ${SqlModifier}`}`;

export type LocalSchemaDefinition = {
  [key: string]: ColumnDefinition | string[];
} & {
  __indices?: string[];
};

export type DefineLocalSchema = (
  tableName: string,
  schema: LocalSchemaDefinition,
  deletePreviousSchema?: boolean
) => void;
