# 📦 Data Access & Sync

## `useSupastashData`

The `useSupastashData` hook is the core way to interact with data in Supastash. It fetches records from your local SQLite database, syncs with Supabase in the background, and listens to live changes over Postgres realtime channels.

---

### ✅ Key Features

- 🔄 **Initial Local Fetch** – Loads records from SQLite on mount.
- 🌐 **Supabase Realtime Subscriptions** – Listens for INSERT, UPDATE, DELETE events.
- 📦 **Batched UI Updates** – Debounces flush to UI with `flushIntervalMs`.
- 🧠 **Memoized Data Output** – Optimized with internal versioning.
- 🧪 **Manual Control (Lazy Mode)** – Delay fetch/subscription until you're ready.
- 🔧 **Fine-grained Callbacks** – Insert, update, delete, and push handlers supported.
- 🧹 **Filter-Aware Syncing** – Supports syncing only filtered data if desired.

---

### 🧠 Usage

Simplified

```tsx
const { data, dataMap } = useSupastashData("orders");
```

Filtered

```tsx
const { data, dataMap, trigger, cancel } = useSupastashData("orders", {
  filter: {
    column: "user_id",
    operator: "eq",
    value: userId,
  },
  shouldFetch: !!userId,
  flushIntervalMs: 200,
  lazy: true,
  realtime: true,
  onInsert: (item) => console.log("Inserted:", item),
  onUpdate: (item) => console.log("Updated:", item),
  onDelete: (item) => console.log("Deleted:", item),
});

useEffect(() => {
  trigger(); // required if lazy mode is enabled
}, []);
```

---

### 🔌 Parameters

| Name                            | Type                                 | Default     | Description                                                       |
| ------------------------------- | ------------------------------------ | ----------- | ----------------------------------------------------------------- |
| `table`                         | `string`                             | —           | Name of the table (should match both local and remote)            |
| `options.shouldFetch`           | `boolean`                            | `true`      | Whether to fetch local data on mount                              |
| `options.filter`                | `RealtimeFilter`                     | `undefined` | Filter to apply both to initial sync and to realtime events       |
| `options.lazy`                  | `boolean`                            | `false`     | Delay the fetch and subscription until `trigger()` is called      |
| `options.flushIntervalMs`       | `number`                             | `100`       | Flush interval for batched updates to UI                          |
| `options.realtime`              | `boolean`                            | `true`      | Enable Supabase realtime subscriptions                            |
| `options.limit`                 | `number`                             | `200`       | Max records to fetch locally                                      |
| `options.useFilterWhileSyncing` | `boolean`                            | `true`      | Whether to apply filter while syncing from remote                 |
| `options.onInsert`              | `(item: any) => void`                | —           | Called when a new record is inserted via realtime                 |
| `options.onUpdate`              | `(item: any) => void`                | —           | Called when a record is updated via realtime                      |
| `options.onDelete`              | `(item: any) => void`                | —           | Called when a record is deleted via realtime                      |
| `options.onInsertAndUpdate`     | `(item: any) => void`                | —           | Shortcut callback for both insert and update                      |
| `options.onPushToRemote`        | `(items: any[]) => Promise<boolean>` | —           | Optional callback triggered after pushing local changes to remote |

---

### 📤 Returns

| Name      | Type             | Description                                            |
| --------- | ---------------- | ------------------------------------------------------ |
| `data`    | `R[]`            | Array of records (memoized on internal version change) |
| `dataMap` | `Map<string, R>` | Map keyed by record `id`                               |
| `trigger` | `() => void`     | Starts fetch and subscription (used when `lazy: true`) |
| `cancel`  | `() => void`     | Cancels an in-flight fetch, prevents further action    |

---

### ⚙️ Under the Hood

1. **Initial Load**:

   - Pulls records from local SQLite (optionally filtered).
   - Ensures the table schema exists. If not, creates one.
   - Triggers a remote pull or pushes unsynced data based on which side has the most recent changes.

2. **Realtime Sync**:

   - Subscribes to `postgres_changes` with optional filters.
   - Buffers events and flushes them to UI.

3. **Event Queue Processing**:

   - Maintains separate queues for inserts, updates, and deletes.

4. **Manual Refresh**:

   - Can listen to custom events (`refresh:table`, `push:table`).
   - This is used internally but be can accessed with `refreshAllTables` and `refreshTable` manually.
   - Triggers a fresh fetch and UI update from the current local state.

---

### 🔐 Notes

- Realtime subscriptions are deduplicated per `table:filter` to avoid redundant listeners.
- The `data` array is re-generated only when internal `version` changes, ensuring minimal re-renders.
- The `filter` you pass must be Supabase-compatible (e.g., `eq`, `lt`, `gte`, etc.).

---

### 🔍 Example: Refresh and Push to UI

```ts
import { supastashEventBus } from "supastash";

supastashEventBus.emit("refresh:orders"); // Triggers local refetch
supastashEventBus.emit("push:orders", newData); // Pushes newData to UI
```

---

### 🧪 Tips

- Use `lazy: true` when the component should not fetch on mount.
- Use `flushIntervalMs` to tune performance for high-frequency updates.
- Use `dataMap` when you need fast lookups by ID or primary key.

---

## 🔄 Table Refresh Utilities

These utilities allow you to programmatically refresh data for specific tables (or all tables) in your Supastash-powered app. Useful when you want to trigger UI reactivity after a local or remote change.
While the `useSupastashData` hook automatically handles refreshes for most common cases, you can manually invoke a refresh when needed.

### 📦 Exports

```ts
import {
  refreshTable,
  refreshAllTables,
} from "supastash/utils/sync/refreshTables";
```

---

### 🧠 Under the Hood

This utility uses a **debounced event emitter** system powered by `supastashEventBus`:

- Events follow the pattern: `refresh:<table>` or `refresh:all`
- Debouncing ensures multiple triggers within a short timeframe do not cause unnecessary re-renders

---

### 🧩 `refreshTable(table: string): void`

Triggers a **debounced refresh** event for a specific table.

#### Example:

```ts
refreshTable("orders");
```

- Emits `refresh:orders` on the event bus after 100ms debounce.
- Use this if you have to after updating or syncing data manually.

---

### 🧩 `refreshAllTables(): void`

Triggers a **debounced global refresh** event for all subscribed tables.

#### Example:

```ts
refreshAllTables();
```

- Emits `refresh:all` after 1000ms debounce.
- Useful after a bulk operation or full sync.

---

### 🛠 Usage in a Component (Example)

```ts
import { refreshTable } from "supastash/utils/sync/refreshTables";

function onSyncComplete() {
  refreshTable("messages");
}
```

---

### 🧩 `refreshTableWithPayload(table, payload, operation)`

Manually pushes data changes to the UI. This is useful when you're syncing changes from a custom source or handling advanced offline scenarios where the UI needs to reflect a specific operation. All calls performed with the `supastash` query builder will be reflected on the UI but you can use this if needed.

> Unlike `refreshTable`, this requires the full payload to be passed and reflects the data immediately in the UI via internal state updates.

#### Parameters:

- `table: string` – The table name to refresh (e.g., `"orders"`)
- `payload: any | any[]` – The full row(s) you want reflected in the UI
- `operation: "insert" | "update" | "delete" | "upsert"` – The type of data operation being simulated

---

#### 🔧 Example:

```ts
refreshTableWithPayload(
  "orders",
  { id: "abc", status: "processing" },
  "update"
); // Must be the full payload!
```

This will emit a `push:orders` event, and the Supastash listener will update the internal state used by `useSupastashData`. Number of event listeners can be increased with [configuring supastash](./configuration.md)

### 🔗 What’s Next?

- [configuration docs](./configuration.md)
- [useSupastash docs](useSupastash-hook.md)
- [Query Builder docs](./supastash-query-builder.md)
