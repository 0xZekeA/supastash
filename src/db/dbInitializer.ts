import { getSupastashConfig } from "@/core/config";
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Gets the supastash database
 * @returns The supastash database
 */
export const getSupaStashDb = async () => {
  const config = getSupastashConfig();
  if (!db) {
    db = await SQLite.openDatabaseAsync(config.dbName);
  }
  return db;
};
