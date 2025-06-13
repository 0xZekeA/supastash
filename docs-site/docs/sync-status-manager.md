# Local Sync & Delete Log Utils

These functions handle internal tracking of the **last sync** and **delete operations** for each table in your local SQLite database. Supastash relies on this metadata to decide what to pull, push, or clean up during sync.

> ⚠️ **For development and debugging only — avoid using them in production.**

---

### 📤 `setLocalSyncLog(tableName: string, lastSyncedAt: string)`

Sets the sync timestamp for a given table.

```ts
await setLocalSyncLog("users", new Date().toISOString());
```

---

### 📥 `getLocalSyncLog(tableName: string)`

Retrieves the sync log for a given table.

```ts
const syncLog = await getLocalSyncLog("users");
/*
{
  table_name: "users",
  lastSyncedAt: "2024-06-01T10:00:00.000Z"
}
*/
```

Returns `null` if the table has no recorded sync log.

---

### 🧹 `clearLocalSyncLog(tableName: string)`

Deletes the sync log for a specific table.

```ts
await clearLocalSyncLog("users");
```

---

### 🔄 `clearAllLocalSyncLog()`

Clears all sync logs table.

```ts
await clearAllLocalSyncLog();
```

> ⚠️ **Warning:** This clears sync history for all tables. Use with caution (e.g., in dev resets).

---

### 🗑 `setLocalDeleteLog(tableName: string, lastDeletedAt: string)`

Sets the lastest deleted timestamp for a given table.

```ts
await setLocalDeleteLog("users", new Date().toISOString());
```

---

### 🔍 `getLocalDeleteLog(tableName: string)`

Retrieves the delete log for a given table.

```ts
const deleteLog = await getLocalDeleteLog("users");
/*
{
  table_name: "users",
  lastDeletedAt: "2024-06-01T10:00:00.000Z"
}
*/
```

Returns `null` if the table has no delete checkpoint.

---

### 🧼 `clearLocalDeleteLog(tableName: string)`

Deletes the delete log for a specific table.

```ts
await clearLocalDeleteLog("users");
```

---

### ❌ `clearAllLocalDeleteLog()`

Drops the entire delete log table.

```ts
await clearAllLocalDeleteLog();
```

> ⚠️ **Warning:** This wipes all delete history for all tables.

### 🔗 What’s Next?

- [Data Access docs](./data-access.md)
- [useSupastash docs](useSupastash-hook.md)
- [Query Builder docs](./supastash-query-builder.md)
