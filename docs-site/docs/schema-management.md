## 🧱 `defineLocalSchema(...)`

Manually defines the schema for a local SQLite table used by Supastash, with support for foreign keys and indexed columns.

This is helpful for:

- Explicitly controlling column types and constraints.
- Defining foreign keys and SQL indexes.
- Ensuring default values and modifiers (e.g., `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`) are present.
- Pre-defining tables before `useSupastashData(...)` is called.
- Avoiding runtime table creation when strict structure is required.

### ⚠️ Important Notes

- `useSupastashData(...)` will automatically **create tables** using Supabase metadata via [`get_table_schema`](./getting-started#3-enable-rls-support-server-side-setup).
  However:

  - It does **not** include default values, modifiers, or indexes.
  - It does **not** apply constraints like `UNIQUE`, `DEFAULT`, or `FOREIGN KEY`.

If your table needs any of these — **you must call `defineLocalSchema(...)` yourself**.

---

### 🧪 Example

```ts
import { defineLocalSchema } from "supastash";

await defineLocalSchema(
  "users",
  {
    id: "TEXT PRIMARY KEY",
    full_name: "TEXT NOT NULL",
    email: "TEXT UNIQUE NOT NULL",
    user_id: "TEXT NOT NULL",
    __indices: ["email", "user_id"],
  },
  true
);
```

---

### 🔧 Parameters

| Name                   | Type                         | Required | Description                                                                  |
| ---------------------- | ---------------------------- | -------- | ---------------------------------------------------------------------------- |
| `tableName`            | `string`                     | ✅       | The name of the table to create.                                             |
| `schema`               | `LocalSchemaDefinition`      | ✅       | The column definitions and optional index/foreign key metadata.              |
| `deletePreviousSchema` | `boolean` (default: `false`) | ❌       | If `true`, drops any existing table and Supastash sync state for that table. |

> ⚠️ **Avoid using `deletePreviousSchema = true` in production.**
> This will wipe local data for that table.

---

### 🧱 Required Columns

Supastash automatically includes these columns for sync and soft-delete support:

```ts
{
  created_at: "TEXT NOT NULL",
  updated_at: "TEXT NOT NULL",
  synced_at: "TEXT DEFAULT NULL",
  deleted_at: "TEXT DEFAULT NULL",
}
```

You must include a valid `id` column (`TEXT PRIMARY KEY`) or the function will throw.

---

### 💡 Column Type Support

Use standard SQLite-compatible strings:

```ts
{
  id: "TEXT PRIMARY KEY",
  quantity: "INTEGER NOT NULL",
  price: "REAL",
  active: "INTEGER DEFAULT 1",
  created_at: "TEXT DEFAULT CURRENT_TIMESTAMP"
}
```

You can combine modifiers:

```ts
name: "TEXT NOT NULL UNIQUE";
```

---

### 🔑 Foreign Keys

> Supastash does **not support foreign keys**.

Foreign key constraints are disabled because **child records can sync before their parent records**. For example, a `soldItem` might arrive before the related `sale` during offline sync. Enforcing foreign keys would cause these inserts to fail and break sync reliability.

Use `__indices` for performance, and handle relationships in Supabase or app logic.

---

### 📈 Indexes

To define SQL indexes on specific columns:

```ts
__indices: ["email", "user_id"];
```

This will create:

```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
```

All columns listed here must also exist in the schema, or an error will be thrown.

---

### 🧼 Resetting a Table

To drop and re-create the table (e.g., during development):

```ts
await defineLocalSchema("users", schema, true);
```

This drops the table and clears all associated Supastash sync metadata.

---

### 📚 Related

- ✅ `useSupastashData(...)`: Automatically creates tables, but without constraints or default values.
- ❌ Does _not_ apply default modifiers or foreign keys — use `defineLocalSchema(...)` when you need control.
