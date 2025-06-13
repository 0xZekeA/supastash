export const syncCalls = new Map<
  string,
  {
    push?: (payload: any) => Promise<boolean>;
    pull?: (payload: any) => Promise<void>;
  }
>();
