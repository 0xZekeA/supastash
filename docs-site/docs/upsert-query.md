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

1. You can pass a single object or an array of objects:

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

2. If `.single()` is chained, the payload **must not** be an array.

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

3. **Using `.withTx()` (Transactional Upsert)**

Use `.withTx()` when you want to upsert a large chunk of data inside its own SQLite transaction for faster writes and data integrity.

```ts
await supastash
  .from("orders")
  .upsert<T>([
    { id: "o1", amount: 150 },
    { id: "o2", amount: 300 },
    // ... 1000+ rows
  ])
  .withTx()
  .run();
```

- **Executes** the entire upsert operation inside a single SQLite transaction.
- **Improves performance** for batch processing by reducing the overhead of individual disk commits.
- **Ensures atomicity**: if any row in the batch fails the upsert, the entire operation is rolled back, preventing partial data updates.

> [!WARNING] > **Do not** use `.withTx()` inside an existing `supastash.withTransaction(...)` block. Nested transactions are not supported and will cause the operation to fail.

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

---

## ⏱️ Timestamp Handling

Supastash helps you keep data in sync by managing timestamps consistently:

- When using [`.update()`](./update-query.md) or `.upsert()`, **if your payload does not include an `updated_at` field**, Supastash will automatically assign `updated_at = new Date().toISOString()` before saving locally and syncing remotely.

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
