export function stringifyComplexFields(record) {
    const result = {};
    for (const key in record) {
        const value = record[key];
        result[key] =
            typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : value;
    }
    return result;
}
