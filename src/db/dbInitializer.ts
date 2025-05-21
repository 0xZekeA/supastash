import * as SQLite from "expo-sqlite";
import { getSupastashConfig } from "../core/config";

let db: SQLite.SQLiteDatabase | null = null;

export const getSupaStashDb = async () => {
  const config = getSupastashConfig();
  if (!db) {
    db = await SQLite.openDatabaseAsync(config.dbName);
  }
  return db;
};
