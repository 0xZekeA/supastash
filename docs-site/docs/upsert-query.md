# `.upsert()` method

The `.upsert()` method in Supastash is a local-first merge operation that inserts or updates rows based on their `id`. If a row with the given `id` exists, it is updated; if not, a new one is inserted.

This operation is ideal when you want to ensure data exists without checking beforehand — combining the behavior of `.insert()` and `.update()`.

---

## 🧠 How It Works

> Each row is checked for existence using the provided `onConflictKeys` (defaults to `["id"]`). If a match is found, the row is updated. Otherwise, it is inserted.

When `.upsert()` is called:

1. The table and payload are validated.
2. Each row is inspected to check if it already exists (via `id`).
3. If it exists → `UPDATE` it.
4. If not → `INSERT` it.
5. Auto-adds timestamps: `updated_at`, and optionally `synced_at`.
6. Returns the upserted records from local DB.

> ⚡ Like other write operations, `.upsert()` uses a **debounced version tracker** to batch rapid changes and trigger a **single UI refresh per table**.

---

## 🧾 Accepted Payloads

You can pass a single object or an array of objects:

```ts
// Single row
await supastash.from("users").upsert<T>({ id: "u1", name: "John" }).run();

// Multiple rows
await supastash
  .from("users")
  .upsert<T>([
    { id: "u1", name: "John" },
    { id: "u2", name: "Doe" },
  ])
  .run();
```

If `.single()` is chained, the payload **must not** be an array.

```ts
// With custom conflict keys
await supastash
  .from("chats")
  .upsert<T>(
    { chat_id: "abc", user_id: "u1", status: "open" },
    {
      onConflictKeys: ["chat_id", "user_id"],
    }
  )
  .run();
```

---

## 🔁 Sync Modes

| Mode          | Behavior                                                |
| ------------- | ------------------------------------------------------- |
| `localOnly`   | Performs upsert only on SQLite                          |
| `remoteOnly`  | Sends entire upsert payload to Supabase, skips local    |
| `localFirst`  | (Default) Performs locally, queues sync to Supabase     |
| `remoteFirst` | Sends to Supabase first, mirrors to local if successful |

You can set sync behavior using `.syncMode("...")`.

---

## 🕒 Timestamp Handling

- `updated_at` is always set to current timestamp if not provided

---

## ✅ Return Shape

If successful:

```ts
{
  data: [...or single object],
  error: null,
  success: true
}
```

If something fails:

```ts
{
  data: null,
  error: { message: "..." },
  success: false
}
```

---

## ⚠️ ID Requirement

Every item must include an `id` field. If `id` is missing, the operation will fail.

```ts
await supastash.from("products").upsert({ name: "Invalid" }); // ❌ no id
```

---

## ✅ When to Use `.upsert()`

- Inserting or updating without worrying about row existence
- Syncing external or merged data sources
- Avoiding manual existence checks before saving
- Supporting conflict-free offline modifications

---

Next: [`.run()` / `.execute()`](./run-executions.md) behaviors
