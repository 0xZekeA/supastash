import getLocalMethod from "../helpers/localDb/getLocalMethod";
/**
 * Queries the local database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function queryLocalDb(state) {
    const { table, method, payload, filters, limit, select, isSingle } = state;
    if (!method) {
        throw new Error("Method is required for local call");
    }
    const query = getLocalMethod(table, method, select, payload, filters, limit, isSingle);
    const result = await query();
    return result;
}
