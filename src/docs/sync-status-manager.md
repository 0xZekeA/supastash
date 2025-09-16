# ⚠️ Deprecated — Local Sync & Delete Log Utilities

> **Status:** Deprecated in newer releases  
> These helpers were early internals and are **not recommended for production**.  
> Use the unified APIs instead: `getSyncLog`, `setSyncLog`, `clearSyncLog`.

---

## Functions

### 📤 `setLocalSyncLog(tableName: string, lastSyncedAt: string, lastCreatedAt?: string)`

> **Deprecated:** Use `setSyncLog`.

Stores the latest sync timestamps for a table.

```ts
await setLocalSyncLog("users", new Date().toISOString());
```

---

### 📥 `getLocalSyncLog(tableName: string)`

> **Deprecated:** Use `getSyncLog`.

Returns the stored sync log for a table, or `null` if none exists.

```ts
const log = await getLocalSyncLog("users");
/*
{
  table_name: "users",
  lastSyncedAt: "2024-06-01T10:00:00.000Z"
}
*/
```

---

### 🧹 `clearLocalSyncLog(tableName: string)`

> **Deprecated:** Use `clearSyncLog`.

Deletes the sync log for one table.

```ts
await clearLocalSyncLog("users");
```

---

### 🔄 `clearAllLocalSyncLog()`

> **Deprecated:** Use `clearSyncLog` with a global/all-tables scope.

Clears all stored sync logs.

```ts
await clearAllLocalSyncLog();
```

> ⚠️ This clears sync history for every table.

---

### 🗑 `setLocalDeleteLog(tableName: string, lastDeletedAt: string)`

> **Deprecated:** Use `setSyncLog` (pass `lastDeletedAt`).

Stores the last delete checkpoint for a table.

```ts
await setLocalDeleteLog("users", new Date().toISOString());
```

---

### 🔍 `getLocalDeleteLog(tableName: string)`

> **Deprecated:** Use `getSyncLog`.

Retrieves the stored delete timestamp for a table.

```ts
const del = await getLocalDeleteLog("users");
/*
{
  table_name: "users",
  lastDeletedAt: "2024-06-01T10:00:00.000Z"
}
*/
```

---

### 🧼 `clearLocalDeleteLog(tableName: string)`

> **Deprecated:** Use `clearSyncLog`.

Clears the delete log for one table.

```ts
await clearLocalDeleteLog("users");
```

---

### ❌ `clearAllLocalDeleteLog()`

> **Deprecated:** Use `clearSyncLog` with a global/all-tables scope.

Deletes all delete checkpoints.

```ts
await clearAllLocalDeleteLog();
```

> ⚠️ This wipes delete history for every table.

---

## Migration Guide

| Old helper               | Replacement                       |
| ------------------------ | --------------------------------- |
| `setLocalSyncLog`        | `setSyncLog`                      |
| `getLocalSyncLog`        | `getSyncLog`                      |
| `clearLocalSyncLog`      | `clearSyncLog`                    |
| `clearAllLocalSyncLog`   | `clearSyncLog` (global/all scope) |
| `setLocalDeleteLog`      | `setSyncLog` (`lastDeletedAt`)    |
| `getLocalDeleteLog`      | `getSyncLog`                      |
| `clearLocalDeleteLog`    | `clearSyncLog`                    |
| `clearAllLocalDeleteLog` | `clearSyncLog` (global/all scope) |

---

## Why Deprecated?

- Unified API is simpler to reason about (one source of truth for created / updated / deleted checkpoints).
- Fewer edge cases; consistent paging and status writes.
- Cleaner surface for public usage.

---

## Related Docs

- [Data Access](./useSupastashData.md)
- [useSupastash Hook](./useSupastash-hook.md)
- [Query Builder](./supastash-query-builder.md)
