/**
 * Sends unsynced data to the remote database for a given table
 * @param table - The table to send the data to
 */
export declare function pushLocalDataToRemote(table: string, onPushToRemote?: (payload: any[]) => Promise<boolean>, noSync?: string[]): Promise<void>;
//# sourceMappingURL=sendUnsyncedToSupabase.d.ts.map