/**
 * Gets the type of the key
 * @param value - The value of the key
 * @returns The type of the key
 */
export function getKeyType(
  value: any
): "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB" {
  if (value === null || value === undefined) return "NULL";

  const valueType = typeof value;

  if (valueType === "number") {
    return Number.isInteger(value) ? "INTEGER" : "REAL";
  }

  if (value instanceof Date) return "TEXT";

  if (
    value instanceof ArrayBuffer ||
    value instanceof Uint8Array ||
    (typeof Buffer !== "undefined" && Buffer.isBuffer(value))
  ) {
    return "BLOB";
  }

  if (valueType === "boolean") return "INTEGER";
  if (valueType === "string") return "TEXT";

  return "TEXT";
}
