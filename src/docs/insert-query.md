# Supastash `.insert()` Explained

The `.insert()` method in Supastash is used to add new rows to a local SQLite table with optional synchronization to Supabase. It follows the familiar Supabase pattern while layering offline-first logic and local-first behavior.

---

## 🧠 How It Works

Calling `.insert()` performs the following steps internally:

1. Validates the payload and target table.
2. Ensures every record has a valid `id`. If missing, Supastash generates a UUID.
3. Adds `created_at`, `updated_at`, and `synced_at` fields if not already included.
4. Writes the data into the local database.
5. Triggers background sync (based on the chosen sync mode).

> 🔁 Supastash always returns the inserted payload as `data`, either as a single object or an array — depending on how it was inserted.

> ⚡ All non-`select` operations (insert, update, delete, upsert) use a **debounced version tracker** to group rapid updates and trigger a **single UI refresh per table**. This prevents unnecessary re-renders in high-frequency update scenarios.

---

## 🧾 Supported Payloads

There are two accepted payload types for `.insert()`:

### 1. **Single Object**

Used when you want to insert a single row:

```ts
await supastash
  .from("orders")
  .insert({ id: "abc", amount: 500 })
  .single() // Optional: to enforce one-row expectation
  .run();
```

- You can optionally chain `.single()` to indicate only one row is expected.
- If you mistakenly pass an array with `.single()`, Supastash will throw:

```txt
.single() cannot be used with array payloads on INSERT to orders. Use a single object instead.
```

### 2. **Array of Objects**

Used for batch inserts:

```ts
await supastash
  .from("orders")
  .insert([
    { id: "o1", amount: 100 },
    { id: "o2", amount: 200 },
  ])
  .run();
```

You should **not** use `.single()` when inserting an array — the method will enforce this at runtime and throw a descriptive error if violated.

---

## 🔐 ID Handling

Supastash guarantees every inserted row has an `id` by default. If any record lacks one, it auto-generates a UUID. This removes the burden of generating IDs manually while ensuring consistency in syncing and querying later.

---

## 🔁 Sync Modes

Sync behavior depends on the mode selected:

| Mode          | Behavior                                             |
| ------------- | ---------------------------------------------------- |
| `localOnly`   | Inserts only into SQLite                             |
| `remoteOnly`  | Sends directly to Supabase, skips local DB           |
| `localFirst`  | (Default) Inserts locally, queues remote sync        |
| `remoteFirst` | Sends to Supabase first, mirrors to local on success |

You can control this with `.syncMode("mode")`:

```ts
await supastash
  .from("orders")
  .insert({ amount: 500 })
  .syncMode("remoteFirst")
  .run();
```

---

## ✅ Return Shape

All `.insert()` calls always return the inserted payload:

```ts
{
  data: [...insertedRecords],
  error: null,
  success: true
}
```

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

## ✅ When to Use `.insert()`

Use `.insert()` when:

- Creating a new row or batch of rows
- Working offline and needing queued syncs
- Wanting automatic `id` + `created_at` + `updated_at` + `synced_at` handling
- Expecting the inserted record(s) to be returned immediately

---

Next: [`.select()`](./select-query.md)
