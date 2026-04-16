/**
 * Gets the type of the key
 * @param value - The value of the key
 * @returns The type of the key
 */
export function getKeyType(value) {
    if (value === null || value === undefined)
        return "NULL";
    const valueType = typeof value;
    if (valueType === "number") {
        return Number.isInteger(value) ? "INTEGER" : "REAL";
    }
    if (value instanceof Date)
        return "TEXT";
    if (value instanceof ArrayBuffer ||
        value instanceof Uint8Array ||
        (typeof Buffer !== "undefined" && Buffer.isBuffer(value))) {
        return "BLOB";
    }
    if (valueType === "boolean")
        return "INTEGER";
    if (valueType === "string")
        return "TEXT";
    return "TEXT";
}
/**
 * Maps the PostgreSQL type to the SQLite type
 * @param data_type - The PostgreSQL type
 * @returns The SQLite type
 */
export function mapPgTypeToSQLite(data_type) {
    switch (data_type) {
        case "character varying":
        case "character":
        case "text":
        case "uuid":
        case "json":
        case "jsonb":
        case "ARRAY":
        case "timestamp without time zone":
        case "timestamp with time zone":
        case "date":
        case "time without time zone":
        case "time with time zone":
        case "inet":
        case "cidr":
        case "macaddr":
        case "tsvector":
        case "tsquery":
        case "interval":
        case "USER-DEFINED":
            return "TEXT";
        case "integer":
        case "bigint":
        case "smallint":
        case "serial":
        case "bigserial":
            return "INTEGER";
        case "boolean":
            return "INTEGER";
        case "numeric":
        case "decimal":
        case "real":
        case "double precision":
        case "money":
            return "REAL";
        case "bytea":
            return "BLOB";
        default:
            return "TEXT";
    }
}
