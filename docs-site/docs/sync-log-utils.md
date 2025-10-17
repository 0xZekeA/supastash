# 📚 Sync Log Utilities

Supastash tracks `created_at`, `updated_at`, and `deleted_at` checkpoints per table and per filter key.  
Use these helpers to inspect or update that metadata.

> 💡 These are the **supported APIs** in newer releases.  
> Legacy helpers such as `setLocalSyncLog` / `setLocalDeleteLog` are **deprecated**.

---

## Functions

### 🧹 `clearLocalSyncLog(tableName: string)`

Clears the stored sync log for a single table.

```ts
await clearLocalSyncLog("users");
```

---

### 🔄 `clearAllLocalSyncLog()`

Drops the entire sync-status table and recreates it.

```ts
await clearAllLocalSyncLog();
```

> ⚠️ This removes sync checkpoints for **all** tables.

---

### 📥 `getSyncLog(tableName: string)`

Returns the stored sync status for one table.

```ts
const log = await getSyncLog("users");

/*
{
  table_name: "users",
  last_synced_at: "2024-06-01T10:00:00.000Z",
  last_created_at: "2024-06-01T10:00:00.000Z",
  last_deleted_at: "2024-06-01T10:00:00.000Z",
  filter_key: "abc123",
  filter_json: "[...]",
  updated_at: "2024-06-01T10:00:00.000Z"
}
*/
```

Returns `null` if the table has no entry.

---

### ✍️ `setSyncLog(table: string, filters: RealtimeFilter[] \| undefined, opts)`

Writes (or updates) sync metadata for a table.

```ts
await setSyncLog("users", undefined, {
  lastSyncedAt: new Date().toISOString(),
  lastCreatedAt: new Date().toISOString(),
  lastDeletedAt: null, // optional
});
```

**Options**

| Field             | Type     | Description                                           |
| ----------------- | -------- | ----------------------------------------------------- |
| `lastSyncedAt`    | `string` | Highest `updated_at` pulled for this table.           |
| `lastCreatedAt`   | `string` | Highest `created_at` pulled.                          |
| `lastDeletedAt`   | `string` | Highest `deleted_at` pulled (for soft-deletes).       |
| `filterNamespace` | `string` | Optional namespace to separate different filter sets. |

> When you supply filters, a filter key is computed and stored along with the timestamps.

---

### 🔁 `resetSyncLog(table: string, filters?: RealtimeFilter[], scope?: "all" \| "last_synced_at" \| "last_created_at" \| "last_deleted_at")`

Resets one or more timestamps for a table.

```ts
// Reset everything for "users"
await resetSyncLog("users", undefined, "all");

// Only reset "last_deleted_at"
await resetSyncLog("users", undefined, "last_deleted_at");
```

`scope` can be:

- `"all"` (default) – resets created, updated, and deleted checkpoints.
- `"last_synced_at"` – resets only the “updated” timestamp.
- `"last_created_at"` – resets only the “created” timestamp.
- `"last_deleted_at"` – resets only the “deleted” timestamp.

---

### 🗑 `clearSyncLog(table: string, filters?: RealtimeFilter[])`

Removes the sync status row for a table + filter key.

```ts
await clearSyncLog("users");
```

If you pass filters, only that key is cleared.  
If no filters are provided, all rows for the table are removed.

---

## Usage Notes

- These helpers manage rows in the internal `supastash_sync_marks` table.
- They are safe to call on demand (e.g., to reset a table during testing).
- For production sync flows, you normally won’t touch these directly—Supastash updates them automatically after pulls/pushes.

---

## Related

- [useSupastashFilters](./useSupastashSyncStatus.md)
- [useSupastashFilters](./useSupastashFilters.md)
- [Pulling & pushing data](./sync-flows.md)
