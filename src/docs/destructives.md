# ☠️ Destructive Operations

These functions allow you to wipe or prune **local SQLite data only** in a Supastash-enabled app.
They do **not** affect your Supabase cloud data. These utilities are mainly intended for development, cache management, or app reset flows.

> ⚠️ Use carefully in production. Some methods are irreversible.

---

## 🔥 `wipeTable(tableName: string): Promise<void>`

Drops a single local table from SQLite and deletes its sync metadata.

### ✅ Use case:

- Dev-only resets
- Per-table corruption handling
- Manual offboarding of feature-specific tables

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
- Fresh install behavior for dev/testing

### Example:

```ts
await wipeAllTables();
```

---

## 🧹 `wipeOldDataForATable(tableName: string, daysFromNow: number): Promise<void>`

Deletes records from a given table that are older than `daysFromNow` days.
Relies on a `created_at` column in the table.

### ✅ Use case:

- Storage cleanup
- Automatic stale data eviction
- Table-specific pruning

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
- These functions are safe to call from `onSchemaInit` in your `configureSupastash` setup.

### 🔗 What’s Next?

- [Data Access docs](./useSupastashData.md)
- [useSupastash docs](useSupastash-hook.md)
