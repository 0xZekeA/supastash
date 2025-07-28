# Sync

---

## 🔄 `syncTable(table: string): Promise<void>`

Triggers a manual sync for a **single table** between your local SQLite database and Supabase.

Use this when you need to **manually refresh data**—like when a user pulls to refresh a list, or when you want instant consistency after a local update.

---

### ⚠️ No Duplicate Syncs

If a sync is already in progress for the specified table, `syncTable` will quietly skip it.
This prevents redundant work and avoids potential race conditions behind the scenes.

---

### ✅ Real-World Example: Pull-to-Refresh with FlatList

```tsx
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSupastashData, syncTable } from "supastash";

const OrdersScreen = () => {
  const { data: orders } = useSupastashData("orders");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await syncTable("orders");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text>{item.title}</Text>
        </View>
      )}
      refreshing={isRefreshing}
      onRefresh={refresh}
    />
  );
};
```

---

### 🧠 Pro Tips

- Use this pattern anywhere the user might expect a manual refresh.
- Guard with `isRefreshing` to keep your UI snappy and avoid stacked requests.
- `syncTable` already skips syncing if one is active, but combining both guards (internal and UI-level) is the safest bet.

---

## 🔄 `syncAllTables(): Promise<void>`

Triggers a manual sync for **all Supastash tables**—regardless of polling cycles.

Great for situations like:

- App resume (sync everything fresh)
- Manual “Sync Now” buttons
- Recovery after a failed background sync

---

### Example: Sync on App Resume

```ts
import { syncAllTables } from "supastash";
import { AppState } from "react-native";

useEffect(() => {
  const sub = AppState.addEventListener("change", async (state) => {
    if (state === "active") {
      await syncAllTables(); // sync everything when app becomes active
    }
  });

  return () => sub.remove();
}, []);
```

→ See also: [`useSupastashData`](useSupastashData.md)
