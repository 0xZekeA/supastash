// Deprecated
const versionMap = new Map();
function getNewVersion(table, setter) {
    if (versionMap.get(table)) {
        versionMap.get(table)?.push(Date.now());
        return;
    }
    else {
        versionMap.set(table, [Date.now()]);
    }
    const timeOut = setTimeout(() => {
        versionMap.delete(table);
        setter(`${table}-${Date.now()}`);
        clearTimeout(timeOut);
    }, 500);
}
export function addPayloadToUI(table, payload, setter, setVersion, operation) {
    const newPayload = Array.isArray(payload) ? payload : [payload];
    setter((prev) => {
        const newMap = new Map(prev);
        if (operation === "delete") {
            for (const item of newPayload) {
                if (!item.id)
                    continue;
                newMap.delete(item.id);
            }
            return newMap;
        }
        for (const item of newPayload) {
            if (!item.id)
                continue;
            newMap.set(item.id, item);
        }
        return newMap;
    });
    getNewVersion(table, setVersion);
}
