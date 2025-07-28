## 🧩 `useSupastashLiteQuery` (⚠️ NOT READY FOR RELEASE)

A **lightweight, local-first hook** made for **offline-friendly React Native apps** using SQLite via Supastash. Think of it as a trimmed-down version of `useSupastashData` — no realtime updates, no global caching, just **full control** over filtering, pagination, and memory usage.

---

### ✅ Ideal For

- When you want to **control exactly what loads and when**
- If you're skipping **Supabase Realtime** for performance, simplicity, or to save memory
- Building **infinite scroll lists** (e.g., FlatList) where you load data in chunks
- Manually handling **refresh** and **load more** behavior

---

### ⚙️ What It Offers

- Offset-based pagination with `loadMore()`
- Manual refresh with `refresh()`
- SQL-safe filters and sorting
- Soft-deletes handled out of the box (`deleted_at IS NULL`)
- Auto-reloads on `liteQueryRefresh:<table>` events
- Clean result shape: flat `data` array + `dataMap` keyed by row `id`

---

### ⚠️ A Few Things to Know

- Your table must have a **string `id` column** — it’s how we keep things deduplicated.
- Filters must be passed in Supastash’s **SQL-safe format**.

---

### 🧪 Example

```tsx
const { data, loadMore, refresh, isLoading, hasMore } =
  useSupastashLiteQuery<Order>("orders", {
    sqlFilter: [{ column: "shop_id", operator: "eq", value: activeShopId }],
    pageSize: 30,
    orderBy: "created_at",
    orderDesc: true,
  });

<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <OrderCard item={item} />}
  onEndReached={loadMore}
  onRefresh={refresh}
  refreshing={isLoading}
  ListFooterComponent={hasMore && isLoading ? <ActivityIndicator /> : null}
/>;
```

---

### 🧠 Behind the Scenes

- Uses `useReducer` instead of `useState` for cleaner state transitions across pages
- Filters are pre-built once on mount or when `sqlFilter` changes
- Tracks each request so older responses don’t override fresh ones
- Handles pagination smartly:

  - `loadMore()` fetches the next page
  - `refresh()` resets to page 0 and reloads

---

### 🛡️ Built to Handle Edge Cases

- Prevents overlapping fetches (no double loads if you tap fast)
- Handles rapid refresh/loadMore calls without messing up state
- Ignores stale requests — only the latest response updates the UI

---

### 📦 What You Get

```ts
{
  data: R[];                  // Your result rows
  dataMap: Map<string, R>;   // Map with rows keyed by ID
  loadMore: () => void;      // Fetch next page
  refresh: () => void;       // Reload from scratch
  hasMore: boolean;          // True if more data to load
  isLoading: boolean;        // Whether it's fetching now
  error: string | null;      // Any error message
}
```

---

### 🧼 Tips for Using It

- Always pass a proper `sqlFilter` — there's no server-side RLS fallback here
- Works great with `FlatList` and other paginated scroll UIs
- If you mutate data, trigger a refresh manually to reflect changes

---

### 💬 Why Use This

This hook is for **predictable, controlled data loading**. Nothing updates behind the scenes unless you tell it to. No surprises.
If you want realtime syncing and shared state across screens, go with `useSupastashData`.
But if you want **fast, minimal, and manual**, this one’s built for you.

## 🔗 What’s Next

- [Configuration Guide](./configuration.md)
- [Query Builder Docs](./supastash-query-builder.md)
- [Hook Reference](./useSupastash-hook.md)
