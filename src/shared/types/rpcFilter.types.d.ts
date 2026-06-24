export type RpcFilterOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "is_null"
  | "is_not_null";

export type RpcSimpleFilter = {
  col: string;
  op: RpcFilterOp;
  /** For "in", pass values as a comma-separated string: "a,b,c" */
  val?: string | number;
};

export type RpcFilterNode =
  | RpcSimpleFilter
  | { or: RpcFilterNode[] }
  | { and: RpcFilterNode[] };

export type RpcTableFilters = Record<string, RpcFilterNode[]>;

export type SyncCountResult = {
  tables: Record<string, number>;
  meta: {
    total_rows: number;
  };
};
