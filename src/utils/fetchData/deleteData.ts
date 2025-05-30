import { permanentlyDeleteData } from "@/core/query/localDbQuery/delete";
import { PayloadData } from "@/types/query.types";
import { createTable } from "@/utils/fetchData/createTable";
import { checkIfTableExist } from "@/utils/tableValidator";
import debounce from "lodash/debounce";

export const deleteData = debounce(
  async (
    payload: PayloadData,
    table: string,
    setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>,
    setVersion: React.Dispatch<React.SetStateAction<number>>,
    dataMap: Map<string, PayloadData>,
    shouldFetch: boolean = true
  ) => {
    if (!shouldFetch) return;

    try {
      const exist = await checkIfTableExist(table);

      if (!exist) {
        await createTable(table, payload);
      }

      // Delete the data
      dataMap.delete(payload.id);
      setDataMap(new Map(dataMap));

      setVersion((prev) => prev + 1);

      await permanentlyDeleteData(table, [
        { column: "id", operator: "=", value: payload.id },
      ]);
    } catch (error) {
      console.error("[Supastash] Error receiving data:", error);
    }
  },
  100
);
