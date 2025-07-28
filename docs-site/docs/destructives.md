# Destructive Operations

These functions clear **only the local SQLite data** — your Supabase cloud data remains safe and untouched.
They're useful for development, clearing cache, or resetting the app’s local state.

> ⚠️ Use carefully in production. Some methods are irreversible.

---

## 🔥 `wipeTable(tableName: string): Promise<void>`

Drops a single local table from SQLite and deletes its sync metadata.

### ✅ Use Cases

- Development-only data resets
- Handling corruption or issues in a specific table
- Manually removing local data for feature-specific tables during offboarding or cleanup

### Example:

```ts
await wipeTable("users");
```

---

## 🔥 `wipeAllTables(): Promise<void>`

Drops **all local tables** managed by Supastash and wipes sync metadata.

### ✅ Use case:

- Full app data reset
- Logout flows

### Example:

```ts
await wipeAllTables();
```

---

## 🧹 `wipeOldDataForATable(tableName: string, daysFromNow: number): Promise<void>`

Deletes records from a specified table that are older than the given `daysFromNow` value.
Requires a `created_at` column to work correctly.

### ✅ Use Cases:

- Freeing up storage space
- Automatically removing stale or outdated data
- Pruning old entries from specific tables

### Example:

```ts
await wipeOldDataForATable("orders", 30); // Deletes records older than 30 days
```

---

## 🧹 `wipeOldDataForAllTables(daysFromNow: number, excludeTables?: string[]): Promise<void>`

Deletes old records across all local tables, skipping any in the `excludeTables` list.

### ✅ Use case:

- Periodic cleanup job
- Disk/memory usage reduction

### Example:

```ts
await wipeOldDataForAllTables(60, ["settings", "user_preferences"]);
```

---

### ⚙️ Notes

- All functions access the local SQLite DB only.
- Deletion is **not recoverable** in production.
- wipe
- These functions are safe to call from `onSchemaInit` in your [`configureSupastash`](./configuration.md) setup.

### 🔗 What’s Next?

- [Data Access docs](./useSupastashData.md)
- [useSupastash docs](useSupastash-hook.md)
