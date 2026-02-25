# 📚 Sync Log Utilities

Supastash tracks `created_at`, `updated_at`, and `deleted_at` checkpoints per table and per filter key.

**Starting from newer releases, Supastash uses `updated_at` as the primary sync cursor.**  
This shift was introduced to **enhance performance, reduce redundant network calls, and simplify sync logic**, while preserving backward compatibility.

> 💡 `updated_at` is now the **authoritative cursor** used during sync operations.  
> `created_at` and `deleted_at` are retained for **metadata, inspection, analytics, and legacy consumers**.

Legacy helpers such as `setLocalSyncLog` / `setLocalDeleteLog` are **deprecated**.

---

## Table of Contents

- [Sync Cursor Model](#sync-cursor-model-important)
- [Functions](#functions)
  - [clearLocalSyncLog](#-clearlocalsynclogtablename-string)
  - [clearAllLocalSyncLog](#-clearalllocalsynclog)
  - [getSyncLog](#-getsynclogtablename-string)
  - [setSyncLog](#-setsyncloglable-string-filters-realtimefilter--undefined-opts)
  - [resetSyncLog](#-resetsyncloglable-string-filters-realtimefilter-scope-all--last_synced_at--last_created_at--last_deleted_at)
  - [clearSyncLog](#-clearsyncloglable-string-filters-realtimefilter)
- [Usage Notes](#usage-notes)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Related Documentation](#related)

---

## Sync Cursor Model (Important)

Supastash follows this internal model:

### `updated_at`

- The single **authoritative sync cursor**
- Used to determine which rows are pulled from the server
- Drives `last_synced_at`
- Used together with the row primary key (`id`) as a compound cursor
- Internally tracked as (`last_synced_at`, `last_synced_at_pk`) to ensure stable paging
- Guaranteed to update on **every mutation** (create, update, soft-delete)

> 💡 Supastash uses a **compound cursor** internally:
> (`updated_at`, `id`)
>
> This guarantees correct pagination when multiple rows share the same `updated_at` timestamp.

### `created_at`

- Preserved for metadata and legacy use
- Not used to determine sync boundaries
- Useful for analytics and audit trails

### `deleted_at`

- Used to represent soft-deletes
- Informational only
- Does not advance the sync cursor independently

> ⚠️ **Important:** Even though all three timestamps are tracked, **only `updated_at` affects sync progression**.

---

## Functions

### 🧹 `clearLocalSyncLog(tableName: string)`

Clears the stored sync log for a single table.

**Usage:**

```typescript
await clearLocalSyncLog("users");
```

**When to use:**

- When you want to force a full resync of a specific table
- During development/testing
- When recovering from sync errors

---

### 🔄 `clearAllLocalSyncLog()`

Drops the entire sync-status table and recreates it.

**Usage:**

```typescript
await clearAllLocalSyncLog();
```

> ⚠️ **Warning:** This removes sync checkpoints for **all tables**. Use with caution in production environments.

**When to use:**

- Complete application reset
- Major schema migrations
- Testing fresh sync scenarios

---

### 📥 `getSyncLog(tableName: string)`

Returns the stored sync status for one table.

**Usage:**

```typescript
const log = await getSyncLog("users");
```

**Returns:**

```typescript
{
  table_name: "users",
  last_synced_at: "2024-06-01T10:00:00.000Z",
  last_synced_at_pk: "00000000-0000-0000-0000-000000000000"
  last_deleted_at: "2024-06-01T10:00:00.000Z",
  filter_key: "abc123",
  filter_json: "[...]",
  updated_at: "2024-06-01T10:00:00.000Z"
}
```

Returns `null` if the table has no entry.

**Use cases:**

- Debugging sync status
- Building custom sync dashboards
- Monitoring sync health

---

### ✍️ `setSyncLog(table: string, filters: RealtimeFilter[] | undefined, opts)`

Writes (or updates) sync metadata for a table.

**Usage:**

```typescript
await setSyncLog("users", undefined, {
  lastSyncedAt: new Date().toISOString(),
  lastCreatedAt: new Date().toISOString(),
  lastDeletedAt: null, // optional
});
```

**With filters:**

```typescript
await setSyncLog("posts", [{ column: "user_id", value: "123" }], {
  lastSyncedAt: new Date().toISOString(),
  lastCreatedAt: new Date().toISOString(),
  filterNamespace: "user_posts",
});
```

#### Options

| Field               | Type             | Required | Description                                                 |
| ------------------- | ---------------- | -------- | ----------------------------------------------------------- |
| `lastSyncedAt`      | `string`         | Yes      | Highest `updated_at` pulled for this table (authoritative). |
| `last_synced_at_pk` | `string`         | Yes      | Highest `id` pulled for this table (authoritative).         |
| `lastCreatedAt`     | `string`         | Yes      | Highest `created_at` observed (informational).              |
| `lastDeletedAt`     | `string \| null` | No       | Highest `deleted_at` observed for soft-deletes.             |
| `filterNamespace`   | `string`         | No       | Optional namespace to separate different filter sets.       |

When filters are supplied, a filter key is computed and stored alongside the timestamps.

---

### 🔁 `resetSyncLog(table: string, filters?: RealtimeFilter[], scope?: "all" | "last_synced_at" | "last_created_at" | "last_deleted_at")`

Resets one or more timestamps for a table.

**Usage examples:**

```typescript
// Reset everything for "users"
await resetSyncLog("users", undefined, "all");

// Only reset the sync cursor
await resetSyncLog("users", undefined, "last_synced_at");

// Only reset deleted metadata
await resetSyncLog("users", undefined, "last_deleted_at");

// Reset with specific filters
await resetSyncLog("posts", [{ column: "user_id", value: "123" }], "all");
```

#### Scope values

| Scope                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| `"all"` (default)     | Resets created, updated, and deleted checkpoints.  |
| `"last_synced_at"`    | Resets only the authoritative `updated_at` cursor. |
| `"last_synced_at_pk"` | Resets only the authoritative `id` cursor.         |
| `"last_deleted_at"`   | Resets only the deleted metadata.                  |

**When to use:**

- Forcing a partial resync
- Testing specific sync scenarios
- Recovering from corrupted sync state

---

### 🗑 `clearSyncLog(table: string, filters?: RealtimeFilter[])`

Removes the sync status row for a table and filter key.

**Usage:**

```typescript
// Clear all sync logs for "users" table
await clearSyncLog("users");

// Clear sync log for specific filter
await clearSyncLog("posts", [{ column: "user_id", value: "123" }]);
```

**Behavior:**

- If filters are provided, only that filter key is cleared.
- If no filters are provided, all sync logs for the table are removed.

**Difference from `resetSyncLog`:**

- `clearSyncLog` **deletes** the sync log entry entirely
- `resetSyncLog` **resets** timestamps to `null` but keeps the entry

---

## Usage Notes

- These helpers manage rows in the internal `supastash_sync_marks` table.
- They are safe to call manually (for testing, resets, or debugging).
- In normal production flows, Supastash updates these automatically after pull and push operations.
- Although multiple timestamps are tracked, sync behavior is driven **exclusively by `updated_at`**.
- Supastash resumes sync using both `last_synced_at` and `last_synced_at_pk` to avoid duplicate or skipped rows when timestamps collide.
- Always use `setSyncLog` with ISO 8601 formatted timestamps.
- Filter keys are automatically computed from filter arrays for consistency.

---

## Migration Guide

### Upgrading from Older Versions

If you're upgrading from an older version of Supastash that used `created_at` as the primary cursor:

#### What Changed

**Before (v0.1.6):**

- Sync relied on separate `created_at` and `deleted_at` tracking
- Newly created rows were often processed more than once
- Multiple cursor paths increased complexity and edge cases

**After (v0.1.6+):**

- Sync now uses a compound (`updated_at`, `id`) cursor internally for stable pagination
- All changes (create, update, soft-delete) advance sync uniformly
- Fewer network calls, simpler logic, and improved performance

#### Migration Steps

1. **No immediate action required** - The new system is backward compatible.

2. **Deprecated functions** - Replace these if you're using them:

   ```typescript
   // ❌ Old (deprecated)
   await setLocalSyncLog("users", new Date().toISOString());
   await setLocalDeleteLog("users", new Date().toISOString());

   // ✅ New
   await setSyncLog("users", undefined, {
     lastSyncedAt: new Date().toISOString(),
     lastCreatedAt: new Date().toISOString(),
   });
   ```

3. **Optional: Force resync** - To ensure clean state:

   ```typescript
   await resetSyncLog("your_table", undefined, "all");
   ```

   > ℹ️ Supastash automatically updates `updated_at` for all mutations it performs
   > (creates, updates, and soft-deletes).
   >
   > However, **database-level enforcement is still recommended**, especially if:
   >
   > - you write to the database outside of Supastash
   > - you use SQL scripts, dashboards, or RPCs
   > - multiple services interact with the same tables

4. Update your database schema (recommended)

Ensure your tables have `updated_at` triggers at the database level to guarantee consistency across _all_ writes.

This makes it impossible for any mutation to bypass `updated_at`, even outside Supastash.

```sql
-- Example trigger for PostgreSQL
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Best Practices

### **Let Supastash manage sync logs automatically**

- Don't manually call `setSyncLog` unless you have a specific reason
- Trust the built-in sync mechanisms

---

## Troubleshooting

### Sync appears stuck

```typescript
// Check current sync status
const status = await getSyncLog("users");
console.log("Last sync:", status?.last_synced_at);

// Force resync
await resetSyncLog("users", undefined, "last_synced_at");
```

### Data not appearing after sync

```typescript
// Verify sync log exists
const log = await getSyncLog("users");
if (!log) {
  console.log("No sync log found - first sync will be full");
}

// Check for filter mismatches
console.log("Current filter key:", log?.filter_key);
```

### Duplicate data appearing

```typescript
// Clear and resync
await clearLocalSyncLog("users");
await pullData("users");
```

---

## Related

- [useSupastashSyncStatus](./useSupastashSyncStatus.md) - React hook for sync status
- [useSupastashFilters](./useSupastashFilters.md) - Managing sync filters
- [Pulling & pushing data](./sync-flows.md) - Complete sync guide
- [Schema Design](./schema-management.md) - Best practices for sync-friendly schemas

---

## API Reference Summary

```typescript
// Clear operations
clearLocalSyncLog(tableName: string): Promise<void>
clearAllLocalSyncLog(): Promise<void>
clearSyncLog(table: string, filters?: RealtimeFilter[]): Promise<void>

// Read operations
getSyncLog(tableName: string): Promise<SyncLog | null>

// Write operations
setSyncLog(
  table: string,
  filters: RealtimeFilter[] | undefined,
  opts: {
    lastSyncedAt: string;
    lastCreatedAt: string;
    lastDeletedAt?: string | null;
    filterNamespace?: string;
  }
): Promise<void>

// Reset operations
resetSyncLog(
  table: string,
  filters?: RealtimeFilter[],
  scope?: "all" | "last_synced_at" | "last_deleted_at"
): Promise<void>
```

---

**Last updated:** January 2025  
**Version:** 0.1.6+  
**Supastash Documentation**
