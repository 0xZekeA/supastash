# Run executions

Supastash queries must be finalized with `.execute()`, `.run()`, or `.go()` — all of which trigger the actual operation after your query is fully constructed.

These methods are interchangeable aliases, but `.execute()` is the primary one. The others are provided for convenience, readability in different contexts, or simply as shorter alternatives.

---

## 🧠 How `.execute()` Works

When `.execute()` is called:

1. Supastash validates the query.
2. The local operation is run first (insert, select, update, etc.).
3. If `viewRemoteResult` is true:

   - Supabase is queried for the remote payload, which is then returned.
   - If remote fails, it retries with exponential backoff based on the retry config.

4. The result is returned based on the mode and visibility settings.

> ⚡ Supastash will reject `.execute()` if no valid method was set (e.g., no `.select()`, `.insert()`, etc.).

---

## 🔁 Retry Behavior

- Retries are only triggered when `viewRemoteResult: true`.
- Retry uses exponential backoff
- Default retry config:

  - `remoteRetry`: `0` (no retries unless explicitly set)
  - `remoteRetryDelay`: `500ms`

You can override with:

```ts
.run({
  viewRemoteResult: true,
  remoteRetry: 3,
  remoteRetryDelay: 1000,
  debug: true,
});
```

---

## 🧾 Return Types

The return format depends on the query method and `viewRemoteResult`:

### If `viewRemoteResult: false` (default):

```ts
{
  data: [... or object],
  error: null,
  success: true
}
```

### If `viewRemoteResult: true`:

```ts
{
  local: [... or object],
  remote: SupabaseResult,
  success: true
}
```

---

## 🛠 When to Use Each

| Method       | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `.execute()` | Clear and explicit — ideal for programmatic or formal use |
| `.run()`     | Simple and common — great for examples and everyday usage |
| `.go()`      | Expressive and readable — fits well in fluent chains      |

All three do the same thing under the hood. Usage depends on your taste.

---

## ✅ When to Use `.run()` or `.execute()`

Use it anytime you want to:

- Finalize and execute a query
- Control sync behavior with `viewRemoteResult`
- Enable retries and debugging
- Retrieve both local and remote data when needed

---

That concludes the core Supastash query lifecycle.

### 🔗 What’s Next?

- [Schema Management docs](./schema-management.md)
