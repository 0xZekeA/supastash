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
const { data, dataMap } = useSupastashData<Order>("orders");
```

This loads `orders` from your local SQLite database, keeps it synced, and returns two things:

- `data` – An array of all rows
- `dataMap` – A map keyed by `id`

---

## 🔍 With Filters, Lazy Load, and Callbacks

```tsx
const { data, dataMap, trigger, cancel, groupedBy } = useSupastashData<Order>(
  "orders",
  {
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
  }
);

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

| Option                     | Type                                 | Default        | Description                                                               |
| -------------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------- |
| `shouldFetch`              | `boolean`                            | `true`         | Whether to automatically fetch local data on mount                        |
| `lazy`                     | `boolean`                            | `false`        | If true, hook does nothing until you manually call `trigger()`            |
| `extraMapKeys`             | `string[]`                           | —              | Build secondary maps for grouping by additional keys (e.g., `chat_id`)    |
| `filter`                   | `SupastashFilter`                    | —              | Filter applied only to Supabase realtime events                           |
| `onlyUseFilterForRealtime` | `boolean`                            | `false`        | If true, `filter` won’t affect local query—just realtime stream           |
| `sqlFilter`                | `SupastashFilter[]`                  | —              | SQL-style filters applied to local and remote queries                     |
| `flushIntervalMs`          | `number`                             | `100`          | Debounce interval for UI updates                                          |
| `realtime`                 | `boolean`                            | `true`         | Whether to subscribe to Supabase `postgres_changes`                       |
| `limit`                    | `number`                             | `1000`         | Max number of local records to load                                       |
| `daylength`                | `number`                             | —              | Fetch only rows created within the last `n` days                          |
| `useFilterWhileSyncing`    | `boolean`                            | `true`         | Apply `filter` to remote sync as well                                     |
| `orderBy`                  | `string`                             | `"created_at"` | Column to order results by                                                |
| `orderDesc`                | `boolean`                            | `true`         | Whether to sort in descending order                                       |
| `clearCacheOnMount`        | `boolean`                            | `false`        | Clears the shared cache for this table when the hook mounts               |
| `onInsert`                 | `(item: any) => void`                | —              | Called when a record is inserted via Supabase                             |
| `onUpdate`                 | `(item: any) => void`                | —              | Called when a record is updated via Supabase                              |
| `onDelete`                 | `(item: any) => void`                | —              | Called when a record is deleted via Supabase                              |
| `onInsertAndUpdate`        | `(item: any) => void`                | —              | Called for both insert and update events                                  |
| `onPushToRemote`           | `(items: any[]) => Promise<boolean>` | —              | Custom push logic for unsynced local records; return `true` if successful |

---

### `extraMapKeys` – Fast Lookups & Grouping Built-In

When working with local data like `orders`, it’s common to filter or group by fields like `user_id` or `status`. Doing that with `.filter()` every time isn’t just repetitive — it’s inefficient, especially as your data grows.

That’s where `extraMapKeys` in `useSupatashData` comes in.

### What It Does

Pass one or more column names to `extraMapKeys`, and Supastash will automatically generate lookup maps for them:

```ts
const { data, dataMap, groupedBy } = useSupatashData("orders", {
  extraMapKeys: ["user_id", "status"],
});
```

Now you get:

- `dataMap.get("order_123")` – fast ID lookup
- `groupedBy.user_id.get("user_42")` – all orders for a user
- `groupedBy.status.get("pending")` – all pending orders

No extra filtering, no extra logic.

### Why It Matters

It’s like having indexed views of your local data — ready to use, already synced, and fast.
This is especially useful for rendering dashboards, grouped lists, or filtering data by key fields.

### Example

```ts
const userOrders = groupedBy.user_id.get(user.id) ?? [];
```

One line. No `filter()`. Faster and scalable.

Use it when you know you’ll be accessing your data by specific fields often. It keeps your code cleaner and your UI snappier.

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

## 🔗 What’s Next

- [Configuration Guide](./configuration.md)
- [Zustand Integration](./zustand.md)
- [Query Builder Docs](./supastash-query-builder.md)
- [Hook Reference](./useSupastash-hook.md)

---

This hook is the **heart of Supastash**.
