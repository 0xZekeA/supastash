# `.update()` method

The `.update()` method in Supastash lets you modify existing rows in a local SQLite table — with optional sync to Supabase. It mirrors the familiar Supabase API but layers in offline-first behavior and sync logic.

---

## 🧠 How It Works

When you call `.update()`, Supastash:

1. Validates the target table and payload.
2. Adds `updated_at` and `synced_at` (if missing).
3. Queues the changes for sync if necessary.
4. Returns the updated rows from the local DB.

> 🔁 Like [`.insert()`](./insert-query.md), the `.update()` call always returns the updated payload(s) in `data`.

> ⚡ All non-`select` operations (insert, update, delete, upsert) use a **debounced version tracker** to group rapid updates and trigger a **single UI refresh per table**. This prevents unnecessary re-renders in high-frequency update scenarios.

---

## ✍🏽 Payload Rules

- Payload must be a plain object (not null or undefined)
- `id` is **not required**, since updates are based on filters

```ts
await supastash
  .from("users")
  .update<T>({ is_active: false })
  .eq("role", "admin")
  .run();
```

This disables all users with the role `admin`.

---

## 🔎 Filters Required

Updates must include at least one `.eq()` or other filters:

```ts
.update({ plan: "premium" }).eq("id", "user_123")
```

Filters build a `WHERE` clause for targeting specific rows. Without filters, all rows would be updated — so use cautiously.

---

## 🕒 Timestamp Handling

Supastash auto-manages timestamps:

- If `updated_at` is missing in the payload, it is added

---

## 🔁 Sync Modes

| Mode          | Behavior                                                        |
| ------------- | --------------------------------------------------------------- |
| `localOnly`   | Updates rows in local DB only                                   |
| `remoteOnly`  | Sends the update directly to Supabase, skips local              |
| `localFirst`  | (Default) Updates locally, queues Supabase update in background |
| `remoteFirst` | Updates Supabase first, mirrors to local if successful          |

You can set sync behavior using `.syncMode("...")`.

---

## ✅ Return Shape

Always returns updated local data:

```ts
{
  data: [...updatedRecords],
  error: null,
  success: true
}
```

If no rows matched the filters, `data` will be an empty array.

If `.single()` was used, `data` is a single object instead of an array.

You can also opt to get Supabase response by passing `{ viewRemoteResult: true }` to `.run()`:

```ts
{
  local: {...},
  remote: {...},
  success: true
}
```

---

## ⚠️ Errors

If payload is null or filters are malformed, you’ll get:

```ts
{
  data: null,
  error: { message: "..." },
  success: false
}
```

Errors are logged automatically for debugging.

---

## ✅ When to Use `.update()`

- Updating rows with sync

---

Next: [`.delete()`](./delete-query.md)
