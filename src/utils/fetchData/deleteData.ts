import { PayloadData } from "../../types/query.types";
import { permanentlyDeleteData } from "../../utils/query/localDbQuery/delete";
import { checkIfTableExist } from "../../utils/tableValidator";
import { createTable } from "./createTable";

export async function deleteData(
  payload: PayloadData,
  table: string,
  setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>,
  setVersion: React.Dispatch<React.SetStateAction<string>>,
  dataMap: Map<string, PayloadData>,
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
    dataMap.delete(payload.id);
    setDataMap(new Map(dataMap));

    setVersion(`${table}-${Date.now()}`);

    await permanentlyDeleteData(table, [
      { column: "id", operator: "=", value: payload.id },
    ]);
  } catch (error) {
    console.error("[Supastash] Error receiving data:", error);
  }
}
