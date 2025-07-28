# 🔄 Manual Refresh

Need to manually trigger a refresh? Use these from:

```ts
import {
  refreshTable,
  refreshAllTables,
} from "supastash/utils/sync/refreshTables";
```

### 🔁 `refreshTable(table: string): void`

For refreshing one table's local data:

```ts
refreshTable("orders");
```

Emits a `refresh:orders` event. Re-fetches local rows + triggers UI update.

### 🔁 `refreshAllTables(): void`

Refreshes everything:

```ts
refreshAllTables();
```

Good after a full sync or reset.

### ⚠️ `refreshTableWithPayload()` (Deprecated)

This used to manually reflect data in the UI. No longer needed — use Supastash queries or `refreshTable()`.

```ts
// Deprecated — avoid
refreshTableWithPayload("orders", { id: "abc", ... }, "update");
```

---

## 🔍 Behind the Scenes

- 🔐 Supastash uses a **version-based cache**: if nothing changes, no re-renders.
- 🧼 Realtime listeners are de-duped per `table + filter`.
- ⚡ Flushes UI updates only after debounce (default 100ms).
- 🧠 Grouped maps (via `extraMapKeys`) use `Map<string, R[]>`.

---

## 💡 Best Practices

- Use `dataMap` for instant lookups (e.g., `dataMap.get(id)`)
- Use `groupedBy.chat_id` for message grouping
- Use `lazy: true` in modal screens or deeply nested routes
- Bump `flushIntervalMs` higher if syncing high-volume tables
- Leverage `onPushToRemote` for custom API pipelines

---

## 🔗 What’s Next

- [useSupastashData](./useSupastashData.md)
- [Configuration Guide](./configuration.md)
- [Query Builder Docs](./supastash-query-builder.md)
- [Hook Reference](./useSupastash-hook.md)

---
