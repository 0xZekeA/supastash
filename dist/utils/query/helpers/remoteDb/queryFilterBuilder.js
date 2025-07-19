import { getSafeValue } from "../../../serializer";
/**
 * Builds a parameterized SQL WHERE clause from selected list of filters.
 *
 * @param filters - The filters to apply to the query
 * @returns An object with the SQL clause and bound values
 */
export function buildWhereClause(filters) {
    if (!filters || !filters.length)
        return { clause: "", values: [] };
    const clauseParts = [];
    const values = [];
    for (const { column, operator, value } of filters) {
        const safeValue = getSafeValue(value);
        switch (operator) {
            case "IN":
                if (!Array.isArray(value) || value.length === 0)
                    continue;
                const isValid = safeValue.every((v) => typeof v === "string" ||
                    typeof v === "number" ||
                    typeof v === "boolean" ||
                    v === null);
                if (!isValid) {
                    throw new Error(`❌ IN clause only supports strings, numbers, or booleans. You passed: ${JSON.stringify(value, null, 2)}`);
                }
                clauseParts.push(`${column} IN (${value.map(() => "?").join(", ")})`);
                values.push(...value);
                break;
            case "IS":
                if (value === null) {
                    clauseParts.push(`${column} IS NULL`);
                }
                else {
                    clauseParts.push(`${column} IS ?`);
                    values.push(safeValue);
                }
                break;
            default:
                clauseParts.push(`${column} ${operator} ?`);
                values.push(safeValue);
                break;
        }
    }
    return {
        clause: clauseParts.length ? `WHERE ${clauseParts.join(" AND ")}` : "",
        values,
    };
}
