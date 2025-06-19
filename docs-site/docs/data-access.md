# 📦 `useSupastashData`

The `useSupastashData` hook is the **core way** to access and sync data in Supastash.
It handles **offline-first fetching**, **real-time updates**, **manual refreshes**, and **fine-grained event control** — all built on SQLite + Supabase.

This doc is your all-in-one guide to understanding how to use it properly.

---

## 🧠 What It Does

`useSupastashData` is a React hook that:

- Loads data instantly from your local SQLite table (even without internet).
- Keeps that data in sync with Supabase — both ways.
- Subscribes to Supabase realtime changes (`INSERT`, `UPDATE`, `DELETE`).
- Minimizes re-renders via smart batching + memoization.
- Supports filtering, grouping, lazy fetch, and custom callbacks.

It's made to be **plug-and-play** — but also powerful enough for edge cases.

---

## ✅ Key Features

- 🔄 **Offline-first loading** from local database
- 🔌 **Realtime Supabase sync** (insert/update/delete)
- 🧠 **Memoized output** (no unnecessary renders)
- ⏯️ **Lazy mode** for manual control
- 📤 **Custom callbacks** for push/pull sync events
- 📦 **Batched updates** via `flushIntervalMs`
- 🔍 **Filter-aware** both locally and remotely
- 🧩 **Grouping support** with `extraMapKeys`

---

## 🧪 Basic Usage

```tsx
const { data, dataMap } = useSupastashData<User>("orders");
```

This loads `orders` from your local SQLite database, keeps it synced, and returns two things:

- `data` – An array of all rows
- `dataMap` – A map keyed by `id`

---

## 🔍 With Filters, Lazy Load, and Callbacks

```tsx
const { data, dataMap, trigger, cancel, groupedBy } = useSupastashData<{
  id: string;
}>("orders", {
  shouldFetch: !!userId, // Only fetch if user is available
  lazy: true, // Wait for manual trigger
  flushIntervalMs: 200, // Reduce render frequency
  filter: {
    column: "user_id",
    operator: "eq",
    value: userId,
  },
  extraMapKeys: ["status", "user_id"],
  onInsert: (order) => console.log("Inserted:", order),
  onUpdate: (order) => console.log("Updated:", order),
  onDelete: (order) => console.log("Deleted:", order),
});

useEffect(() => {
  trigger(); // Only needed if lazy: true
}, []);
```

---

## 📦 Return Values

| Name        | Type                               | Description                                   |
| ----------- | ---------------------------------- | --------------------------------------------- |
| `data`      | `R[]`                              | Array of rows from local table                |
| `dataMap`   | `Map<string, R>`                   | Keyed map of rows by their `id`               |
| `groupedBy` | `Record<string, Map<string, R[]>>` | Optional grouped maps by field (if specified) |
| `trigger`   | `() => void`                       | Starts fetch + subscription (if lazy)         |
| `cancel`    | `() => void`                       | Stops sync and fetch (useful for cleanup)     |

---

## ⚙️ Hook Options

| Option                  | Type                                 | Default | Description                                            |
| ----------------------- | ------------------------------------ | ------- | ------------------------------------------------------ |
| `shouldFetch`           | `boolean`                            | `true`  | Fetch on mount?                                        |
| `lazy`                  | `boolean`                            | `false` | If true, nothing runs until you call `trigger()`       |
| `extraMapKeys`          | `string[]`                           | —       | Build grouped maps (e.g., `groupedBy.chat_id`)         |
| `filter`                | `RealtimeFilter`                     | —       | Only sync matching rows (`eq`, `lt`, etc.)             |
| `flushIntervalMs`       | `number`                             | `100`   | Debounce for batched UI updates                        |
| `realtime`              | `boolean`                            | `true`  | Subscribe to Supabase `postgres_changes`               |
| `limit`                 | `number`                             | `200`   | Limit for local rows                                   |
| `daylength`             | `number`                             | —       | Fetch only records from the last _n_ days              |
| `useFilterWhileSyncing` | `boolean`                            | `true`  | Use same filter when syncing with Supabase             |
| `onInsert`              | `(item: any) => void`                | —       | Called on Supabase `INSERT`                            |
| `onUpdate`              | `(item: any) => void`                | —       | Called on Supabase `UPDATE`                            |
| `onDelete`              | `(item: any) => void`                | —       | Called on Supabase `DELETE`                            |
| `onInsertAndUpdate`     | `(item: any) => void`                | —       | Shortcut for insert + update                           |
| `onPushToRemote`        | `(items: any[]) => Promise<boolean>` | —       | Handle custom push logic (must return success boolean) |

---

## 🔁 Advanced Callbacks

### `onInsertAndUpdate`

This fires on both inserts and updates from Supabase. Perfect for logic like marking messages as "received":

```ts
onInsertAndUpdate: async (payload) => {
  const { data: local } = await supastash
    .from("messages")
    .select("*")
    .eq("id", payload.id)
    .run();

  if (!local || local.is_received) return;

  await supastash
    .from("messages")
    .upsert({ ...local, is_received: true })
    .run();
};
```

### `onPushToRemote`

Customize how local records get pushed to Supabase:

```ts
onPushToRemote: async (payload) => {
  const result = await supabase.from("messages").upsert(payload);
  return !result.error;
};
```

Return `true` on success — Supastash will retry otherwise.

---

## 🔄 Manual Refresh

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

- [Configuration Guide](./configuration.md)
- [Query Builder Docs](./supastash-query-builder.md)
- [Hook Reference](./useSupastash-hook.md)

---

This hook is the **heart of Supastash**.
