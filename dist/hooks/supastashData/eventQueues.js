import { useRef } from "react";
import { deleteData } from "../../utils/fetchData/deleteData";
import { receiveData } from "../../utils/fetchData/receiveData";
import useDataState from "./dataState";
function useEventQueues(table, options, flushIntervalMs) {
    const { dataMap } = useDataState(table);
    const insertQueue = useRef([]);
    const updateQueue = useRef([]);
    const deleteQueue = useRef([]);
    const flushTimer = useRef(null);
    const flush = () => {
        if (options.shouldFetch) {
            insertQueue.current.forEach((item) => {
                receiveData(item, table, options.shouldFetch, options.onInsertAndUpdate || options.onInsert);
            });
            updateQueue.current.forEach((item) => {
                receiveData(item, table, options.shouldFetch, options.onInsertAndUpdate || options.onInsert);
            });
            deleteQueue.current.forEach((item) => {
                deleteData(item, table, options.shouldFetch);
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
    const queueHandler = (eventType, data) => {
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
