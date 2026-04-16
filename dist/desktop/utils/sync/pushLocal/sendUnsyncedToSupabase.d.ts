/**
 * Sends unsynced data to the remote database for a given table.
 * Returns true if it pushed anything (creates/updates OR deletes), else false.
 */
export declare function pushLocalDataToRemote(table: string, onPushToRemote?: (payload: any[]) => Promise<boolean>, noSync?: string[]): Promise<boolean | undefined>;
//# sourceMappingURL=sendUnsyncedToSupabase.d.ts.map