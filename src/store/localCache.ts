import { PayloadData } from "../types/query.types";

export const localCache = new Map<
  string,
  {
    data: Array<PayloadData>;
    dataMap: Map<string, PayloadData>;
    groupedBy?: Record<string | number, Map<any, Array<PayloadData>>>;
  }
>();
