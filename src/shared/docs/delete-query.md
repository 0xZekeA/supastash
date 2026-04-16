# Supastash `.delete()` Explained

The `.delete()` method in Supastash performs **soft deletes** by default — meaning it sets a `deleted_at` timestamp on the affected rows. This keeps the data in the local DB while marking it as deleted for sync and UI purposes. Once synced, row will then be deleted.

> ⚠️ Supastash does **not** permanently delete data until it's synced to remote db.

---

## 🧠 How It Works

When you call `.delete()`:

1. Filters are validated and used to construct a `WHERE` clause.
2. Supastash selects matching rows.
3. Those rows are updated locally to include `deleted_at`, `updated_at`, and `synced_at` timestamps.
4. The update is queued for sync (unless in `localOnly` mode).
5. Once synced, data is immediately deleted from the db.

> ⚡ Like `.insert()` and `.update()`, Supastash uses a **debounced version tracker** to batch deletes and trigger a **single UI refresh per table**.

> 🔄 Once a delete operation is successfully synced, the row is **immediately removed from the local DB**. Data is **never deleted from the remote DB** — only soft-deleted using a `deleted_at` timestamp.

---

## ✂️ Soft vs Hard Deletes

- **Soft Delete (default)**:

  - Sets `deleted_at`, retains row in DB
  - Used in `.delete()` calls with filters

- **Hard Delete**:

  - Fully removes matching rows from the table
  - Used internally when required by sync logic or explicitly via `permanentlyDeleteData()`

```ts
await supastash.from("tasks").delete().eq("id", "task_1").run();
```

This will soft-delete the task but leave it available locally with a `deleted_at` timestamp.

---

## 🔎 Filters Required

All `.delete()` calls require at least one filter:

```ts
.delete().eq("project_id", "proj_123")
```

This ensures safe, scoped deletes and prevents accidental wipes.

---

## 🕒 Timestamp Handling

The following timestamps are added automatically:

- `deleted_at`: when the row was soft-deleted
- `updated_at`: current time
- `synced_at`:

  - `null` for `localFirst`, `remoteOnly`
  - set to `now` for `localOnly`, `remoteFirst`

---

## 🔁 Sync Modes

| Mode          | Behavior                                                   |
| ------------- | ---------------------------------------------------------- |
| `localOnly`   | Sets `deleted_at` locally and hard deletes in same call    |
| `remoteOnly`  | Sends soft delete to Supabase only, no local touch         |
| `localFirst`  | (Default) Soft deletes locally, queues sync to Supabase    |
| `remoteFirst` | Sends delete to Supabase, then applies soft delete locally |

You can use `.syncMode("...")` to control this behavior.

---

## ✅ Return Shape

Always returns the rows that matched the filters before they were marked deleted:

```ts
{
  data: null,
  error: null,
  success: true
}
```

---

## ⚠️ Errors

If filters are missing or malformed, or the operation fails:

```ts
{
  data: null,
  error: { message: "..." },
  success: false
}
```

---

## ✅ When to Use `.delete()`

- Removing rows
- Preserving offline sync integrity
- Marking items as deleted while retaining structure for re-sync
- Auditing deleted records locallyå

---

Next: [`.upsert()`](./upsert-query.md)
