// Deprecated

const versionMap = new Map<string, number[]>();

function getNewVersion(
  table: string,
  setter: React.Dispatch<React.SetStateAction<string>>
) {
  if (versionMap.get(table)) {
    versionMap.get(table)?.push(Date.now());
    return;
  } else {
    versionMap.set(table, [Date.now()]);
  }

  const timeOut = setTimeout(() => {
    versionMap.delete(table);
    setter(`${table}-${Date.now()}`);
    clearTimeout(timeOut);
  }, 500);
}

export function addPayloadToUI(
  table: string,
  payload: any | any[],
  setter: React.Dispatch<React.SetStateAction<Map<string, any>>>,
  setVersion: React.Dispatch<React.SetStateAction<string>>,
  operation: "insert" | "update" | "delete" | "upsert"
) {
  const newPayload = Array.isArray(payload) ? payload : [payload];
  setter((prev) => {
    const newMap = new Map(prev);
    if (operation === "delete") {
      for (const item of newPayload) {
        if (!item.id) continue;
        newMap.delete(item.id);
      }
      return newMap;
    }
    for (const item of newPayload) {
      if (!item.id) continue;
      newMap.set(item.id, item);
    }
    return newMap;
  });

  getNewVersion(table, setVersion);
}
