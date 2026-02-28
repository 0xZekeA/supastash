# 🧱 Schema Management

## 🧱 `defineLocalSchema(...)`

Manually defines the schema for a local SQLite table used by Supastash.

This is helpful for:

- Explicitly controlling column types and constraints.
- Ensuring default values and modifiers (e.g., `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`) are present.
- Pre-defining tables before `useSupastashData(...)` is called.
- Will not replace previously created tables unless it's called with the `deletePreviousSchema` argument.

### ⚠️ Important Notes

- `useSupastashData(...)` will automatically **create local tables** using the remote schema (via Supabase RPC), but:

  - It does **not** include default values or constraints.
  - It does **not** include modifiers like `UNIQUE`, `DEFAULT`, or `PRIMARY KEY`.
  - It only ensures the structure exists enough to read/write data.

If your local table needs strict constraints, timestamps, or default values — **use `defineLocalSchema(...)` manually instead.**

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
    created_by: "TEXT",
  },
  true
); // Pass `true` if you want to force re-creation
```

---

### 🔧 Parameters

| Name                   | Type                               | Required | Description                                                                  |
| ---------------------- | ---------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `tableName`            | `string`                           | ✅       | The name of the table to create.                                             |
| `schema`               | `Record<string, ColumnDefinition>` | ✅       | The column definitions (see below).                                          |
| `deletePreviousSchema` | `boolean` (default: `false`)       | ❌       | If `true`, drops any existing table and Supastash sync state for that table. |

> ⚠️ Avoid setting `deletePreviousSchema = true` in production unless you’re resetting development state. It will delete all existing local data for that table.

---

### 🧱 Required Columns

Regardless of what you pass in `schema`, Supastash will **automatically** include these columns:

```ts
{
  created_at: "TEXT NOT NULL",
  updated_at: "TEXT NOT NULL",
  synced_at: "TEXT DEFAULT NULL",
  deleted_at: "TEXT DEFAULT NULL",
}
```

Your schema **must include** an `id` column (UUID format as `TEXT`). If omitted, the function will throw an error.

---

### 💡 Column Type Support

Columns are defined using string templates based on SQL types and modifiers. Examples:

```ts
{
  id: "TEXT PRIMARY KEY",
  quantity: "INTEGER NOT NULL",
  price: "REAL",
  active: "INTEGER DEFAULT 1",
  created_at: "TEXT DEFAULT CURRENT_TIMESTAMP"
}
```

You can combine multiple modifiers like so:

```ts
"name": "TEXT NOT NULL UNIQUE"
```

---

### 🧼 Resetting a Table

To reset the schema (e.g., in development):

```ts
await defineLocalSchema("users", schema, true);
```

This drops the table, clears sync metadata, and re-creates the table with the new schema.

---

### 📚 Related

- ✅ `useSupastashData(...)`: Automatically creates missing tables, but with no constraints or default values.
- ❌ Does _not_ apply default constraints like `NOT NULL`, `UNIQUE`, or `DEFAULT` — use `defineLocalSchema(...)` for those.

Here’s a clear explanation of the `getSupastashDb` function, including what it does, how it works, and how it's used in the Supastash ecosystem:

---

## 🔌 `getSupastashDb()`

### 📄 Description

Returns the active SQLite database instance that Supastash uses to perform all local-first operations — such as reads, writes, and sync tracking.

It **lazily initializes** the database connection only once (singleton pattern), using the adapter specified in your Supastash configuration.

---

### 🧠 How It Works

1. **Retrieves your Supastash config** using `getSupastashConfig()`.
2. **Checks for presence** of both:

   - `sqliteClient`: The raw SQLite client you've passed during setup.
   - `sqliteClientType`: A string that tells Supastash which adapter to use (`expo`, `rn-nitro`, `rn-storage`).

3. If the database instance hasn't been initialized yet:

   - Calls that adapter’s `openDatabaseAsync(...)` method with the configured DB name and client.

4. Caches the result in a `db` variable so future calls don’t re-open the database.

---

### ✅ Supported Client Types

| Client Type    | Adapter Used           | Compatible With               |
| -------------- | ---------------------- | ----------------------------- |
| `"expo"`       | `SQLiteAdapterExpo`    | `expo-sqlite`                 |
| `"rn-storage"` | `SQLiteAdapterStorage` | `react-native-sqlite-storage` |
| `"rn-nitro"`   | `SQLiteAdapterNitro`   | `react-native-quick-sqlite`   |

---

### 🔧 API Methods

| Method                        | Description                                                                                                                                                                    | Returns                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `runAsync(sql, params?)`      | Executes a single statement (e.g., `INSERT`, `UPDATE`, `DELETE`)                                                                                                               | `Promise<void>`        |
| `getAllAsync(sql, params?)`   | Fetches **all rows** from a `SELECT` query                                                                                                                                     | `Promise<any[]>`       |
| `getFirstAsync(sql, params?)` | Fetches **first row only** (or `null` if none) from a `SELECT` query                                                                                                           | `Promise<any \| null>` |
| `execAsync(statements)`       | Executes multiple SQL statements separated by `;` (used in schema creation)                                                                                                    | `Promise<void>`        |
| `withTransaction(fn)`         | Executes multiple operations inside a single SQLite transaction. Automatically commits on success and rolls back if an error is thrown. Nested transactions are not supported. | `Promise<T>`           |

Follows the same call patterns as `expo-sqlite`, making it familiar and easy to use.

---

### 📦 Example Usage

This function is used **internally** by other Supastash functions (e.g., `defineLocalSchema`, query runners, sync processors) but can also be called manually if you need raw access to the database:

```ts
const db = await getSupastashDb();
const users = await db.getAllAsync("SELECT * FROM users");

await db.withTransaction(async (tx) => {
  await tx.runAsync(
    `INSERT INTO orders (id, customer_name, total_amount, created_at)
     VALUES (?, ?, ?, ?)`,
    ["1", "John Udoka", 250.0, new Date().toISOString()]
  );

  await tx.runAsync(
    `INSERT INTO order_items (id, order_id, product_name, quantity, price)
     VALUES (?, ?, ?, ?, ?)`,
    ["10", "1", "Premium Shirt", 2, 125.0]
  );
});
```

---

### ⚠️ Notes

- If `configureSupastash(...)` hasn't been called before this, the config will be empty and this function will throw.
- This method assumes the client and clientType are correctly configured; if not, an error will be thrown.
- This is designed to be **adapter-agnostic**, so it supports multiple SQLite engines while exposing a unified interface.

---

### 📋 `getAllTables(): Promise<string[] | null>`

Returns a list of all user-defined tables in the local SQLite database, **excluding** internal tables used by Supastash.

#### ✅ Example

```ts
const tables = await getAllTables();
console.log(tables);
// ["users", "orders", "transactions"]
```

#### 📌 Use Cases

- Listing all tables available for syncing or inspection.
- Dynamic tooling (e.g., admin panels, migration utilities).
- Debugging which user tables are present in the local DB.

#### 🔁 Return

- `string[]` – array of table names (excluding system/internal).
- `null` – if no user tables are found.

### 🔗 What’s Next?

- [Data Access docs](./useSupastashData.md)
- [useSupastash docs](useSupastash-hook.md)
- [Query Builder docs](./supastash-query-builder.md)
