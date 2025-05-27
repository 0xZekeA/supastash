/**
 * Converts a value into a stable JSON string representation.
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
 * @returns A stable stringified version of the input
 */
export function getSafeValue(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return stableStringify(value);
  return value;
}
