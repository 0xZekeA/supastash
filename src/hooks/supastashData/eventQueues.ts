import { useRef } from "react";
import { PayloadData } from "../../types/query.types";
import { RealtimeOptions } from "../../types/realtimeData.types";
import { deleteData } from "../../utils/fetchData/deleteData";
import { receiveData } from "../../utils/fetchData/receiveData";
import useDataState from "./dataState";

function useEventQueues(
  table: string,
  setDataMap: React.Dispatch<React.SetStateAction<Map<string, any>>>,
  setVersion: React.Dispatch<React.SetStateAction<string>>,
  options: RealtimeOptions,
  flushIntervalMs: number
) {
  const { dataMap } = useDataState(table);

  const insertQueue = useRef<PayloadData[]>([]);
  const updateQueue = useRef<PayloadData[]>([]);
  const deleteQueue = useRef<PayloadData[]>([]);
  const flushTimer = useRef<number | NodeJS.Timeout | null>(null);

  const flush = () => {
    if (options.shouldFetch) {
      insertQueue.current.forEach((item) => {
        receiveData(item, table, setDataMap, setVersion, options.shouldFetch);
        options.onInsertAndUpdate?.(item) || options.onInsert?.(item);
      });
      updateQueue.current.forEach((item) => {
        receiveData(item, table, setDataMap, setVersion, options.shouldFetch);
        options.onInsertAndUpdate?.(item) || options.onUpdate?.(item);
      });
      deleteQueue.current.forEach((item) => {
        deleteData(
          item,
          table,
          setDataMap,
          setVersion,
          dataMap,
          options.shouldFetch
        );
        options.onDelete?.(item);
      });
      insertQueue.current = [];
      updateQueue.current = [];
      deleteQueue.current = [];
    }
  };

  const scheduleFlush = () => {
    if (!flushTimer.current) {
      flushTimer.current = setTimeout(() => {
        flush();
        flushTimer.current = null;
      }, flushIntervalMs);
    }
  };

  const queueHandler = (eventType: string, data: PayloadData) => {
    switch (eventType) {
      case "INSERT":
        insertQueue.current.push(data);
        break;
      case "UPDATE":
        updateQueue.current.push(data);
        break;
      case "DELETE":
        deleteQueue.current.push(data);
        break;
    }
    scheduleFlush();
  };

  return queueHandler;
}

export default useEventQueues;
