import getLocalMethod from "../helpers/localDb/getLocalMethod";
/**
 * Queries the local database
 * @param state - The state of the query
 * @returns The result of the query
 */
export async function queryLocalDb(state) {
    const { method } = state;
    if (!method) {
        throw new Error("[Supastash] Method is required for local call");
    }
    const query = getLocalMethod(state);
    const result = await query();
    return result;
}
