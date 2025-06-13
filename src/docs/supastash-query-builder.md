# Supastash Query Builder

Supastash provides a powerful, chainable query builder designed for **local-first CRUD operations** in SQLite with optional Supabase sync. Inspired by Supabase’s API, it mimics the same method chaining you’re already familiar with — making it intuitive to adopt.

## 🧱 How the Query Builder Works

At its core, Supastash lets you perform CRUD operations in a structured, chainable manner:

1. **Start the query**: `supastash.from("table")`
2. **Choose the method**: `.select()`, `.insert()`, `.update()`, `.upsert()`, or `.delete()`
3. **Add filters**: Chain `.eq()`, `.gt()`, `.in()` etc., to narrow down results
4. **Optional tweaks**: Add `.limit()`, `.single()`, or `.syncMode()`
5. **Execute it**: Use `.run()` or `.execute()` to trigger the operation

It was designed to mirror the Supabase client’s querying style, so if you’ve used Supabase, it’ll feel immediately familiar.

---

## 🌐 Local-First by Default

Supastash is built around offline-first principles:

- `.select()` queries **only pull from local SQLite** unless `syncMode("remoteOnly")` or `viewRemoteResult: true` is explicitly set.
- Insert/update/upsert/delete operations happen locally, then sync to Supabase.
- You can opt-in to view the remote result by passing `{ viewRemoteResult: true }` into `.run()`.

> 🔔 **Default syncMode is `localFirst`** — ensuring local responsiveness while syncing to Supabase in the background.

---

## 🔄 Sync Behavior

Each query can define its own sync strategy with `.syncMode()`:

- `localOnly`: Operates only on the local SQLite DB
- `remoteOnly`: Targets Supabase only (no local interaction)
- `localFirst`: Uses local DB first, and queues remote sync in background (default)
- `remoteFirst`: Attempts the operation on Supabase first. If successful, the result is mirrored to the local database. Useful when you want to validate a successful remote operation (e.g., write) before persisting anything locally.

Syncs are queued, retried with backoff, and track `synced_at` to mark completion.

Depending on execution context and sync options, results are returned as follows:

- ✅ If `viewRemoteResult: true`, the result contains:

  ```ts
  {
    remote: Supabase response or null,
    local: Local response or null,
    success: boolean
  }
  ```

- ✅ For `.delete()` operations (without `viewRemoteResult`):

  ```ts
  {
    error: null | error,
    success: boolean
  }
  ```

- ✅ For most other operations:

  ```ts
  {
    data: result from local DB (or remote if remoteOnly),
    error: null | error,
    success: boolean
  }
  ```

These return types ensure predictable access regardless of whether you're handling arrays, single rows, or sync-aware actions.

---

## 🔎 Supported Filter Methods

Filtering supports common SQL-like operators:

- `.eq(column, value)` – equals
- `.neq(column, value)` – not equals
- `.gt(column, value)` – greater than
- `.lt(column, value)` – less than
- `.gte(column, value)` – greater than or equal
- `.lte(column, value)` – less than or equal
- `.like(column, value)` – pattern match
- `.is(column, value)` – IS NULL / IS TRUE logic
- `.in(column, array)` – IN clause

Filters can be chained together seamlessly.

---

## ✅ Safe Operations and Events

- Automatically assigns UUIDs if `id` is missing on insert
- Throws errors for unsafe patterns (e.g., `.single()` with multiple items)
- Emits push events on write operations to update local cache/UI
- Handles `synced_at` timestamps internally for robust syncing

---

## 📌 Summary

Supastash Query Builder offers a structured, local-first API that looks and feels like Supabase. It prioritizes offline support and background sync — so your app stays fast, consistent, and resilient.

Detailed explanations of each method (`insert`, `select`, `update`, `delete`, etc.) will follow. For now, this overview covers the core architecture and design philosophy.

```ts
// Example usage:
await supastash.from("users").select().eq("status", "active").run();

await supastash.from("orders").run();
```

Next: [`.insert()`](./insert-query.md)
