export function isTrulyNullish(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      (value.trim().toLowerCase() === "null" ||
        value.trim().toLowerCase() === "undefined" ||
        value.trim() === "")) ||
    (typeof value === "number" && isNaN(value))
  );
}

/**
 * Converts a value into a stable JSON string representation.
 *
 * @param obj - The object to convert
 * @returns A stable stringified version of the input
 */
function stableStringify(obj: any): string {
  if (Array.isArray(obj)) return JSON.stringify(obj);
  if (typeof obj === "object" && obj !== null) {
    return JSON.stringify(
      Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = obj[key];
          return acc;
        }, {} as Record<string, any>)
    );
  }
  return JSON.stringify(obj);
}

/**
 * Converts a value into a stable JSON string representation.
 *
 * @param value - The value to convert
 * @returns A stable stringified version of the input
 */
export function getSafeValue(value: any): any {
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    const allPrimitives = value.every(
      (v) =>
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null
    );
    if (allPrimitives) return value;

    const allObjects = value.every((v) => typeof v === "object" && v !== null);
    if (allObjects) return value.map(stableStringify);

    return stableStringify(value);
  }

  if (typeof value === "object") return stableStringify(value);

  return value;
}
