# Supastash Filters

Supastash's filter builder lets you narrow down query results using a fluent, chainable API modeled after Supabase's client. Filters are appended after calling `.select()`, `.update()`, `.delete()`, or any other CRUD method on a table.

---

## How Filters Work

Filters are collected into the query and applied as SQL `WHERE` clauses when the query executes against the local SQLite database (or Supabase, depending on your sync mode). You can chain as many filters as needed, they are combined with `AND` logic.

```ts
await supastash
  .from("users")
  .select()
  .eq("status", "active")
  .gte("age", 18)
  .run();
```

---

## Filter Methods

### `.eq(column, value)`

Filters rows where `column = value`.

```ts
.eq("role", "admin")
// WHERE role = 'admin'
```

---

### `.neq(column, value)`

Filters rows where `column != value`.

```ts
.neq("status", "deleted")
// WHERE status != 'deleted'
```

---

### `.gt(column, value)`

Filters rows where `column > value`.

```ts
.gt("score", 100)
// WHERE score > 100
```

---

### `.lt(column, value)`

Filters rows where `column < value`.

```ts
.lt("price", 50)
// WHERE price < 50
```

---

### `.gte(column, value)`

Filters rows where `column >= value`.

```ts
.gte("created_at", "2024-01-01")
// WHERE created_at >= '2024-01-01'
```

---

### `.lte(column, value)`

Filters rows where `column <= value`.

```ts
.lte("quantity", 100)
// WHERE quantity <= 100
```

---

### `.like(column, value)`

Filters rows using SQL `LIKE` pattern matching. Use `%` as a wildcard.

```ts
.like("name", "%john%")
// WHERE name LIKE '%john%'
```

---

### `.is(column, value)`

Filters rows using SQL `IS` logic. Useful for `NULL` checks or boolean comparisons.

```ts
.is("deleted_at", null)
// WHERE deleted_at IS NULL

.is("verified", true)
// WHERE verified IS TRUE
```

---

### `.in(column, values[])`

Filters rows where `column` matches any value in the provided array.

```ts
.in("status", ["active", "pending", "invited"])
// WHERE status IN ('active', 'pending', 'invited')
```

---

## Additional Query Modifiers

These methods aren't filters per se, but they are commonly chained alongside filters to control query behavior.

### `.limit(n)`

Restricts the number of rows returned.

```ts
.limit(10)
```

---

### `.single()`

Returns a single object instead of an array. Automatically sets `limit(1)`. Throws if more than one result is found.

```ts
await supastash.from("users").select().eq("id", userId).single().run();
// Returns: { data: { id, name, ... }, error, success }
```

---

### `.cacheFirst()`

Available on `.select()` only. Resolves the query from local SQLite first, falling back to Supabase if no usable result is found.

```ts
await supastash
  .from("products")
  .select()
  .eq("id", productId)
  .cacheFirst()
  .run();
```

---

### `.syncMode(mode)`

Overrides the default sync strategy for this specific query.

| Mode          | Behavior                                                    |
| ------------- | ----------------------------------------------------------- |
| `localOnly`   | Only reads/writes to local SQLite                           |
| `remoteOnly`  | Only targets Supabase                                       |
| `localFirst`  | Uses local first, syncs to remote in background _(default)_ |
| `remoteFirst` | Writes to Supabase first, then mirrors to local on success  |

```ts
.syncMode("remoteOnly")
```

---

## Executing the Query

Once your filters are set, call `.run()`, `.execute()`, or `.go()` — all three are equivalent.

```ts
const { data, error, success } = await supastash
  .from("orders")
  .select()
  .eq("user_id", currentUser.id)
  .lte("total", 500)
  .limit(20)
  .run();
```

### With remote result visibility

Pass `{ viewRemoteResult: true }` to see both local and remote responses:

```ts
const result = await supastash
  .from("orders")
  .select()
  .eq("status", "pending")
  .run({ viewRemoteResult: true });

// result.local — local SQLite response
// result.remote — Supabase response
// result.success — boolean
```

### With retry logic

For remote operations, you can configure retries with exponential backoff:

```ts
.run({
  viewRemoteResult: true,
  remoteRetry: 3,         // up to 3 retries
  remoteRetryDelay: 500   // starting delay in ms (doubles each retry)
})
```

---

## Full Example

```ts
const { data, error } = await supastash
  .from("products")
  .select()
  .eq("category", "electronics")
  .gte("price", 100)
  .lte("price", 999)
  .in("brand", ["Sony", "Samsung", "Apple"])
  .is("in_stock", true)
  .limit(25)
  .run();
```

This translates roughly to:

```sql
SELECT * FROM products
WHERE category = 'electronics'
  AND price >= 100
  AND price <= 999
  AND brand IN ('Sony', 'Samsung', 'Apple')
  AND in_stock IS TRUE
LIMIT 25;
```
