# Supastash Query Builder

Supastash provides a powerful, chainable query builder designed for **local-first CRUD operations** in SQLite with optional Supabase sync. Inspired by Supabase’s API, it mimics the same method chaining you’re already familiar with — making it intuitive to adopt.

## 🧱 How the Query Builder Works

At its core, Supastash lets you perform CRUD operations in a structured, chainable manner:

1. **Start the query**: `supastash.from("table")`
2. **Choose the method**: [`.select()`](./select-query.md), [`.insert()`](./insert-query.md), [`.update()`](./update-query.md), [`.upsert()`](./upsert-query.md), or [`.delete()`](./delete-query.md)
3. **Add filters**: Chain `.eq()`, `.gt()`, `.in()` etc., to narrow down results
4. **Optional tweaks**: Add `.limit()`, `.single()`, or `.syncMode()`
5. **Execute it**: Use [`.run()`](./run-executions.md) or [`.execute()`](./run-executions.md) to trigger the operation

It was designed to mirror the Supabase client’s querying style, so if you’ve used Supabase, it’ll feel immediately familiar.

---

## 🌐 Local-First by Default

Supastash is built on **offline-first principles**, meaning your app stays responsive — even without a network.

- `.select()` reads **only from local SQLite** by default. To fetch from Supabase instead, use `syncMode("remoteOnly")` or set [`viewRemoteResult: true`](./run-executions.md) in `.run()`.

- [`insert`](./insert-query.md), [`update`](./update-query.md), [`upsert`](./upsert-query.md), and [`delete`](./delete-query.md) all **write locally first**, then sync to Supabase automatically.
- Want the Supabase result immediately? Pass `{ viewRemoteResult: true }` into `.run()`.

> ⚡️ **The default `syncMode` is `localFirst`** — this gives you fast local reads and writes, while syncing to Supabase quietly in the background.

---

## 🔄 Sync Behavior

Control how each query syncs by setting a `.syncMode()`:

| Mode          | What it does                                               |
| ------------- | ---------------------------------------------------------- |
| `localOnly`   | Reads/writes only from the local SQLite database           |
| `remoteOnly`  | Talks directly to Supabase, skipping local storage         |
| `localFirst`  | _(Default)_ Uses local first, then syncs in the background |
| `remoteFirst` | Sends to Supabase first, updates local only if it succeeds |

Syncs are queued, retried with backoff, and track `synced_at` to mark completion.

Depending on execution context and sync options, results are returned as follows:

- ✅ If [`viewRemoteResult: true`](./run-executions.md), the result contains:

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
