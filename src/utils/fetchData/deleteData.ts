import { PayloadData } from "../../types/query.types";
import { permanentlyDeleteData } from "../../utils/query/localDbQuery/delete";
import { checkIfTableExist } from "../../utils/tableValidator";
import { logError } from "../logs";
import { refreshScreen } from "../refreshScreenCalls";
import { createTable } from "./createTable";

export async function deleteData(
  payload: PayloadData,
  table: string,
  shouldFetch: boolean = true
) {
  if (!shouldFetch) return;

  try {
    const exist = await checkIfTableExist(table);

    if (!exist) {
      await createTable(table, payload);
    }

    if (!payload?.id) return;

    // Delete the data
    await permanentlyDeleteData(table, [
      { column: "id", operator: "=", value: payload.id },
    ]);
    refreshScreen(table);
  } catch (error) {
    logError("[Supastash] Error receiving data:", error);
  }
}
