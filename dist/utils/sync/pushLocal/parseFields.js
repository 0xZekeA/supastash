/**
 * Parses stringified fields in a record
 * @param record - The record to parse
 * @returns The parsed record
 */
export function parseStringifiedFields(record) {
    const parsed = {};
    for (const key in record) {
        const value = record[key];
        if (typeof value === "string") {
            try {
                const maybeParsed = JSON.parse(value);
                parsed[key] = maybeParsed;
            }
            catch {
                parsed[key] = value;
            }
        }
        else {
            parsed[key] = value;
        }
    }
    return parsed;
}
