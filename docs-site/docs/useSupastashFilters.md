## 🛡️ `useSupastashFilters`

A simple but **critical hook** that tells Supastash _what rows_ to sync from Supabase — **table by table**.

If your app has **multiple users**, **locations**, or **shops**, you don't want to sync _everything_. You only want _what matters_ to the current user. That’s exactly what this hook handles.

---

### 🧠 What’s This For?

`useSupastashFilters()` helps you:

- **Filter** what data gets pulled from Supabase
- Make sure your app doesn't fetch other users’ or locations’ data
- Avoid bugs caused by **invalid filters** or **wrong sync conditions**
- Keep your app **in sync and secure** across devices

---

### ⚙️ How It Works

1. You pass in a simple object where each key is a **table name** (like `"orders"`), and the value is a list of **filter rules**.
2. Each filter tells Supastash: _"Only pull rows where this column matches this value."_
3. It checks for mistakes — like typos or bad operators — and shows helpful warnings if anything’s wrong.
4. Valid filters are saved and used every time Supastash syncs that table.

---

### 🧪 Example

```ts
useSupastashFilters({
  orders: [
    { column: "shop_id", operator: "eq", value: currentShopId },
    { column: "status", operator: "in", value: ["pending", "completed"] },
  ],
  inventory: [
    { column: "location_id", operator: "eq", value: selectedLocationId },
  ],
});
```

In this example:

- Only `orders` that belong to the current shop and have `pending` or `completed` status will sync.
- Only `inventory` tied to the selected location will sync.

Simple, scoped, and safe.

---

### 🧷 What Does a Filter Look Like?

Each filter must include:

```ts
{
  column: "shop_id",         // the column you're filtering by
  operator: "eq",            // the condition: eq, in, gt, lt, etc.
  value: "abc123"            // the value to match (string, number, array, or null)
}
```

Operators include:

- `"eq"` (equal)
- `"in"` (value is in an array)
- `"gt"` / `"lt"` / `"gte"` / `"lte"`
- `"is"` (for `null`, `true`, or `false`)

---

### 🚨 Possible Warnings

Supastash is designed to help you avoid silent bugs. You might see:

- **Invalid filter warning**
  Example:
  `[Supastash] Invalid filter: { column: '', operator: 'eq', value: '...' } for table orders`
  → You left something out or used a bad operator.

- **Unknown table warning**
  `[Supastash] Table products does not exist`
  → You’re trying to filter a table that hasn’t been defined locally.

- **Filter mismatch warning**
  `[Supastash] Filter signature mismatch for table  orders`
  → You’re using different filters for the same table across multiple hook calls. That can break sync logic.

---

```

- Always set filters for **every table that syncs**, unless you have strict RLS (Row Level Security) rules on Supabase.

---

### ✅ Real-World Use Cases

| App Type       | What to Filter By    |
| -------------- | -------------------- |
| Multi-shop     | `shop_id`            |
| Multi-location | `location_id`        |
| User-specific  | `user_id`            |
| Soft deletes   | `deleted_at IS NULL` |
| Active records | `is_active = true`   |

---

### 💥 What Happens If You Skip This?

If you **don’t use filters** (and don’t have RLS), your app might:

- Pull **all rows** from a table (even for other users)
- Waste memory and bandwidth
- Break in production with **missing or mismatched data**
- Filters will default to realtimeFilters used in the `useSupastashData` hook

So yeah — don’t skip this part.

---

### 🧵 TL;DR

`useSupastashFilters()` is your **sync gatekeeper**.

It makes sure your app _only pulls what it should_, catches mistakes early, and keeps your local-first experience rock solid.
```

---

## 🔗 What’s Next

- [Configuration Guide](./configuration.md)
- [Query Builder Docs](./supastash-query-builder.md)
- [Hook Reference](./useSupastash-hook.md)
