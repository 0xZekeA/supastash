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

---

## ⏱️ Timestamp Handling

Supastash helps you keep data in sync by managing timestamps consistently:

- When using `.update()` or `.upsert()`, **if your payload does not include an `updated_at` field**, Supastash will automatically assign `updated_at = new Date().toISOString()` before saving locally and syncing remotely.

- This ensures reliable sync conflict resolution and avoids stale data.

> Want to preserve a custom `updated_at` value (e.g., from an imported backup or pre-synced record)?
> Simply include it in your payload:

```ts
await supastash
  .from("tasks")
  .upsert({ id: "xyz", title: "Fix bug", updated_at: oldDate })
  .run();
```

If `updated_at` is explicitly set to `null` or `undefined`, it will be **replaced with the current timestamp** unless `preserveTimestamp` is configured.

> ⚠️ For full control, use `.preserveTimestamp(true)`.

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
