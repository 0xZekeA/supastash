type SqlPrimitive = "TEXT" | "INTEGER" | "REAL" | "BLOB" | "NUMERIC";

type SqlModifier =
  | "PRIMARY KEY"
  | "NOT NULL"
  | "UNIQUE"
  | "DEFAULT"
  | "AUTOINCREMENT"
  | "CHECK"
  | "REFERENCES"
  | "COLLATE"
  | "ON CONFLICT"
  | string;

type ColumnDefinition = `${SqlPrimitive}${
  | ""
  | ` ${SqlModifier}`
  | ` ${SqlModifier} ${SqlModifier}`
  | ` ${SqlModifier} ${SqlModifier} ${SqlModifier}`}`;

type LocalSchemaDefinition = Record<string, ColumnDefinition>;

export type DefineLocalSchema = (
  tableName: string,
  schema: LocalSchemaDefinition,
  deletePreviousSchema?: boolean
) => void;
