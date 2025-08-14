import { getSupastashDb } from "../../db/dbInitializer";
import { syncStatusMap } from "../../store/syncStatus";

/**
 * Sets the sync status of a query (row) in a specific table.
 * Automatically removes the entry if the status is 'success'.
 *
 * @param rowId - The unique ID of the row
 * @param table - The name of the table
 * @param status - One of: "pending", "success", or "error"
 */
export function setQueryStatus(
  rowId: string,
  table: string,
  status: "pending" | "success" | "error"
) {
  if (status === "success") {
    syncStatusMap.get(table)?.delete(rowId);
    return;
  }
  if (syncStatusMap.has(table)) {
    syncStatusMap.get(table)?.set(rowId, status);
  } else {
    syncStatusMap.set(table, new Map());
    syncStatusMap.get(table)?.set(rowId, status);
  }
}

/**
 * Gets the sync status of a table from the database.
 *
 * @param table - Table name
 */
export async function getQueryStatusFromDb(table: string) {
  const db = await getSupastashDb();

  const tableData = await db.getAllAsync(
    `SELECT id FROM ${table} WHERE synced_at IS NULL`
  );

  let tableMap = syncStatusMap.get(table);
  if (!tableMap) {
    tableMap = new Map();
    syncStatusMap.set(table, tableMap);
  }

  for (const row of tableData) {
    tableMap.set(row.id, "pending");
  }
}

/**
 * Gets the aggregate sync status of a specific table.
 *
 * @param table - Table name
 * @returns An object with:
 *  - size: total tracked rows
 *  - errors: number of rows in "error" status
 *  - pending: number of rows in "pending" status
 *  - status: overall table status: "success" | "pending" | "error"
 */
export function getTableStatus(table: string) {
  const tableStatus = syncStatusMap.get(table);
  const size = tableStatus?.size;

  const statusArray = Array.from(tableStatus?.values() || []);
  let errorCount = 0;
  let pendingCount = 0;

  statusArray.forEach((status) => {
    if (status === "error") {
      errorCount++;
    } else if (status === "pending") {
      pendingCount++;
    }
  });

  let status = "success";
  if (pendingCount > 0) {
    status = "pending";
  } else if (errorCount > 0) {
    status = "error";
  }

  return { size, errors: errorCount, pending: pendingCount, status };
}

/**
 * Gets the global sync status across all tracked tables.
 *
 * @returns "error" if any table has errors,
 *          "pending" if any table is syncing,
 *          "synced" if all tables are fully synced
 */
export function getSupastashStatus() {
  const tables = Array.from(syncStatusMap.keys());

  for (const table of tables) {
    const tableStatus = getTableStatus(table);
    if (tableStatus.status === "error") {
      return "error";
    }
    if (tableStatus.status === "pending") {
      return "pending";
    }
  }

  return "synced";
}
