## 🧱 `defineLocalSchema(...)`

Programmatically creates or refreshes a **local SQLite table** used by Supastash.
It provides full control over your schema, including column definitions, constraints, and indexes — ensuring consistent structure across devices.

---

### 🧩 What It Does

- Creates the table **exactly as defined** (columns, types, modifiers).

- Automatically adds missing **system columns** required for sync and soft deletes:

  ```ts
  {
    created_at: "TEXT NOT NULL",
    updated_at: "TEXT NOT NULL",
    synced_at: "TEXT DEFAULT NULL",
    deleted_at: "TEXT DEFAULT NULL",
  }
  ```

- Validates that all columns in `__indices` exist before creating indexes.

- Automatically creates **indexes** for the following columns (if present):

  - `synced_at`
  - `deleted_at`
  - `created_at`
  - `updated_at`

- Creates any additional indexes listed under `__indices`.

- Optionally **drops** the existing table and clears Supastash sync state when `deletePreviousSchema = true`.

---

### 🚫 What It Doesn’t Do

- Does **not** infer default values, unique constraints, or foreign keys from Supabase metadata.
- Does **not** enforce foreign keys — by design — since related records may sync out of order.
- Does **not** create composite or partial indexes automatically (you can define these manually under `__constraints`).

---

### 💡 When To Use

Use `defineLocalSchema(...)` when you need:

- Strict, predictable table shapes (types, defaults, constraints).
- Local indexes for faster sync and lookups.
- Control over structure without relying on runtime inference.

If you don’t need any of these, `useSupastashData(...)` can auto-create tables — but without modifiers or indexes.

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

    // additional indexes beyond default sync columns
    __indices: ["email", "user_id"],

    // optional composite / partial constraints
    // __constraints: "CREATE INDEX IF NOT EXISTS idx_users_shop_synced ON users(shop_id, synced_at)"
  },
  true // ⚠️ drops and recreates table + clears local sync state
);
```

---

### ⚙️ Parameters

| Name                   | Type                         | Required | Description                                                    |
| ---------------------- | ---------------------------- | -------- | -------------------------------------------------------------- |
| `tableName`            | `string`                     | ✅       | The name of the local SQLite table.                            |
| `schema`               | `LocalSchemaDefinition`      | ✅       | The column definitions and optional index/constraint metadata. |
| `deletePreviousSchema` | `boolean` (default: `false`) | ❌       | Drop the table and Supastash sync state before recreating.     |

> ⚠️ **Avoid using **`deletePreviousSchema(...,true)`** in production.**\
> It permanently deletes local data for that table.

---

### 📦 Required Columns

You must define an `id` column (`TEXT PRIMARY KEY`).\
Other system columns are auto-added if missing:

```ts
{
  created_at: "TEXT NOT NULL",
  updated_at: "TEXT NOT NULL",
  synced_at: "TEXT DEFAULT NULL",
  deleted_at: "TEXT DEFAULT NULL",
}
```

---

### 📈 Indexing Behavior

#### ✅ Auto-created indexes (if column exists)

- `synced_at` → speeds up pending-push scans.
- `deleted_at` → optimizes soft-delete lookups.
- `updated_at` → used for incremental sync (changed-since queries).
- `created_at` → used for sort or history lists.

#### ⚙️ Custom indexes

Specify them explicitly:

```ts
__indices: ["email", "user_id"];
```

Which generates:

```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
```

All `__indices` must exist in the schema or `defineLocalSchema(...)` throws.

---

### 🧼 Resetting a Table

To force a rebuild of a table and its local sync state:

```ts
await defineLocalSchema("users", schema, true);
```

---

### 🔗 Related

- ✅ `useSupastashData(...)` — auto-creates tables from Supabase metadata.
- ❌ Does _not_ apply constraints, defaults, or indexes.
- ⚙️ `defineLocalSchema(...)` — use when structure and performance matter.
