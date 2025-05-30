import { PayloadData } from "@/types/query.types";
import { createTable } from "@/utils/fetchData/createTable";
import { upsertData } from "@/utils/sync/pullFromRemote/updateLocalDb";
import { checkIfTableExist } from "@/utils/tableValidator";
import debounce from "lodash/debounce";

export const receiveData = debounce(
  async (
    payload: PayloadData,
    table: string,
    setDataMap: React.Dispatch<React.SetStateAction<Map<string, PayloadData>>>,
    setVersion: React.Dispatch<React.SetStateAction<number>>,
    shouldFetch: boolean = true
  ) => {
    if (!shouldFetch) return;

    try {
      const exist = await checkIfTableExist(table);

      if (!exist) {
        await createTable(table, payload);
      }

      // Update the data
      setDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(payload.id, payload);
        return newMap;
      });

      setVersion((prev) => prev + 1);

      await upsertData(table, payload);
    } catch (error) {
      console.error("[Supastash] Error receiving data:", error);
    }
  },
  100
);
