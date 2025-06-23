import { getSupastashConfig } from "../../../core/config";
import { getSupastashDb } from "../../../db/dbInitializer";
import { refreshScreen } from "../../refreshScreenCalls";
import { getSafeValue } from "../../serializer";
import { updateLocalSyncedAt } from "../../syncUpdate";
import { buildWhereClause } from "../helpers/remoteDb/queryFilterBuilder";
import { operatorMap } from "../helpers/remoteDb/queryUtils";
import { permanentlyDeleteData } from "../localDbQuery/delete";
/**
 * Queries the supabase database
 * @param state - The state of the query
 * @param isBatched - Whether the query is batched
 * @returns The result of the query
 */
export async function querySupabase(state, isBatched = false) {
    const { table, method, payload, filters, limit, select, isSingle, type, onConflictKeys, viewRemoteResult, preserveTimestamp, } = state;
    const config = getSupastashConfig();
    let newPayload;
    const timeStamp = new Date().toISOString();
    if (Array.isArray(payload) && payload.length > 0) {
        newPayload = payload.map((item) => {
            const { synced_at, ...rest } = item;
            const newItem = { ...rest };
            if (!preserveTimestamp) {
                const userUpdatedAt = item.updated_at;
                newItem.updated_at =
                    userUpdatedAt !== undefined ? userUpdatedAt : timeStamp;
            }
            return newItem;
        });
    }
    else if (payload) {
        const { synced_at, ...rest } = payload;
        newPayload = { ...rest };
        if (!preserveTimestamp) {
            const userUpdatedAt = payload.updated_at;
            newPayload.updated_at =
                userUpdatedAt !== undefined ? userUpdatedAt : timeStamp;
        }
    }
    if (!config.supabaseClient) {
        throw new Error("[Supastash] Supabase Client is required to perform this operation.");
    }
    const upsertOrInsertPayload = Array.isArray(newPayload)
        ? newPayload
        : [newPayload];
    if (method === "upsert" &&
        newPayload &&
        onConflictKeys &&
        onConflictKeys.length > 0) {
        for (const item of upsertOrInsertPayload) {
            const colArray = Object.keys(item);
            const includesConflictKeys = onConflictKeys.some((key) => colArray.includes(key));
            if (!includesConflictKeys) {
                throw new Error(`onConflictKeys must include at least one key from the payload. Payload: ${JSON.stringify(newPayload)}`);
            }
        }
    }
    const supabase = config.supabaseClient;
    let query = supabase.from(table);
    let filterQuery;
    switch (method) {
        case "select":
            filterQuery = query.select(select || "*");
            break;
        case "insert":
            if (!newPayload)
                throw new Error("[Supastash] Insert payload is missing.");
            filterQuery = query.insert(newPayload);
            break;
        case "update":
            if (!newPayload)
                throw new Error("[Supastash] Update payload is missing.");
            filterQuery = query.update(newPayload);
            break;
        case "upsert":
            const conflictKey = Array.isArray(onConflictKeys) && onConflictKeys.length > 0
                ? onConflictKeys.join(",")
                : "id";
            if (!newPayload)
                throw new Error("[Supastash] Upsert payload is missing.");
            filterQuery = query.upsert(newPayload, {
                onConflict: conflictKey,
            });
            break;
        case "delete":
            filterQuery = query.update({
                deleted_at: timeStamp,
                updated_at: timeStamp,
            });
            break;
        default:
            throw new Error(`[Supastash] Unsupported method "${method}"`);
    }
    if (method !== "upsert") {
        // Apply filters
        if (filters?.length && method !== "insert") {
            for (const { column, operator, value } of filters) {
                const op = operatorMap(operator);
                filterQuery = filterQuery[op](column, value);
            }
        }
        if (limit != null) {
            filterQuery = filterQuery.limit(limit);
        }
        if (isSingle) {
            filterQuery = filterQuery.single();
        }
    }
    if (!isBatched &&
        newPayload &&
        (Array.isArray(newPayload) ? newPayload.length > 0 : true) &&
        (viewRemoteResult || type === "remoteOnly")) {
        filterQuery = filterQuery.select();
    }
    const result = await filterQuery;
    const db = await getSupastashDb();
    if (!result.error &&
        method !== "select" &&
        type !== "remoteOnly" &&
        type !== "remoteFirst") {
        if (method === "insert" && newPayload) {
            for (const item of upsertOrInsertPayload) {
                await updateLocalSyncedAt(table, item.id);
            }
        }
        if (method === "upsert" && newPayload) {
            const onConflictKeysArray = onConflictKeys && onConflictKeys.length > 0 ? onConflictKeys : ["id"];
            for (const item of upsertOrInsertPayload) {
                const colArray = Object.keys(item);
                const includesConflictKeys = onConflictKeysArray.every((key) => colArray.includes(key));
                if (!includesConflictKeys) {
                    throw new Error(`Upsert failed: Conflict keys [${onConflictKeysArray.join(", ")}] must exist in payload. Received: ${JSON.stringify(item)}`);
                }
                const whereClause = onConflictKeysArray
                    .map((key) => `${key} = ?`)
                    .join(" AND ");
                const conflictValues = onConflictKeysArray.map((key) => getSafeValue(item[key]));
                await db.runAsync(`UPDATE ${table} SET synced_at = ? WHERE ${whereClause}`, [timeStamp, ...conflictValues]);
            }
        }
        if (filters?.length) {
            const { clause, values: filterValues } = buildWhereClause(filters);
            await db.runAsync(`UPDATE ${table} SET synced_at = ? WHERE ${clause}`, filterValues);
            if (method === "delete") {
                await permanentlyDeleteData(table, filters);
            }
        }
        refreshScreen(table);
    }
    return result;
}
