import { CrudMethods, PayloadData, SupastashQuery } from "../types/query.types";

export const txStore = {} as Record<
  string,
  SupastashQuery<CrudMethods, boolean, PayloadData>[]
>;
