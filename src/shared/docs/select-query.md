# Supastash `.select()` Explained

The `.select()` method in Supastash is used to retrieve rows from a local SQLite table. Like Supabase, it supports filtering, limiting, and column selection — but with offline-first behavior.

> 🔍 By default, `.select()` **only reads from the local database** unless `syncMode("remoteOnly")` or `viewRemoteResult: true` is used.

---

## 🧠 How It Works

Calling `.select()` performs the following steps:

1. Validates the target table.
2. Constructs a `SELECT` SQL statement using provided columns and filters.
3. Applies a limit if specified.
4. Runs the query against the local SQLite DB.
5. Parses any JSON-like fields for proper deserialization.

The method supports returning either a single result or a list, depending on whether `.single()` was chained.

---

## 🧾 Selecting Data

### 1. **Multiple Rows (Default)**

```ts
const result = await supastash
  .from("orders")
  .select("id, amount")
  .eq("status", "pending")
  .run();

// result.data: [{ id: "a1", amount: 500 }, ...]
```

### 2. **Single Row with `.single()`**

```ts
const result = await supastash
  .from("users")
  .select("id, email")
  .eq("id", "user_123")
  .single()
  .run();

// result.data: { id: "user_123", email: "test@mail.com" }
```

If `.single()` is used and no record is found, `data` will be `null`.

### 3. **With Type`** Can be used on all crud methods

```ts
interface User {
  id: string;
  email: string;
}

const result = await supastash
  .from("users")
  .select<User>("id, email")
  .eq("id", "user_123")
  .single()
  .run();

// result.data: { id: "user_123", email: "test@mail.com" }
```

---

## 🔎 Filters and Columns

- You can select specific columns or use `*` to select all
- Filters support all standard operators: `.eq()`, `.gt()`, `.in()`, etc.

Example:

```ts
await supastash
  .from("tasks")
  .select("id, title")
  .eq("assigned_to", "user_1")
  .limit(10)
  .run();
```

---

## 🧪 Return Shape

| Case        | Returned Data                     |                          |
| ----------- | --------------------------------- | ------------------------ |
| `.single()` | \`{ data: object                  | null, error, success }\` |
| Default     | `{ data: array, error, success }` |                          |

You always get a `data` field with the result:

- It’s `null` on failure
- It’s a single object if `.single()` is used
- It’s an array of objects otherwise

---

## ⚠️ Errors

If the table does not exist or the query fails, you’ll get:

```ts
{
  data: null,
  error: { message: "..." },
  success: false
}
```

Errors are logged to the console for easier debugging.

---

## ✅ When to Use `.select()`

- Reading from the local DB
- Displaying cached data
- Performing offline queries
- Filtering results or limiting the number of rows

If you want fresh data from Supabase, use `.syncMode("remoteOnly")` or pass `{ viewRemoteResult: true }` to `.run()`.

---

Next: [`.update()`](./update-query.md)
