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
  val?: string | number;
};

export type RpcFilterNode =
  | RpcSimpleFilter
  | { or: RpcFilterNode[] }
  | { and: RpcFilterNode[] };

export type RpcTableFilters = Record<string, RpcFilterNode[]>;
