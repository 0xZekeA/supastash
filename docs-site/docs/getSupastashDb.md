# 📦 Supastash Database Adapter

Supastash utilizes a **pluggable SQLite adapter system** to support multiple SQLite engines, including `Expo SQLite`, `Nitro SQLite`, and `react-native-sqlite-storage`.

The `getSupastashDb()` function serves as the **single entry point** for obtaining the active database connection, ensuring the library remains engine-agnostic and transaction-safe.

---

## 🧠 Purpose

The `getSupastashDb()` function returns a normalized `SupastashSQLiteDatabase` instance designed to:

- **Wrap** the underlying SQLite engine.
- **Expose** a consistent API surface across different platforms.
- **Handle** transactions safely (auto-commit/rollback).

> [!IMPORTANT] > **Internal Rule:** Never interact directly with the raw SQLite client inside Supastash internals. Always use `getSupastashDb()`.

---

### 🔧 API Methods

| Method                        | Description                                                                                                                                                                    | Returns                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `runAsync(sql, params?)`      | Executes a single statement (e.g., `INSERT`, `UPDATE`, `DELETE`)                                                                                                               | `Promise<void>`        |
| `getAllAsync(sql, params?)`   | Fetches **all rows** from a `SELECT` query                                                                                                                                     | `Promise<any[]>`       |
| `getFirstAsync(sql, params?)` | Fetches the **first row only** (or `null` if none) from a `SELECT` query                                                                                                       | `Promise<any \| null>` |
| `execAsync(statements)`       | Executes multiple SQL statements separated by `;` (typically used for schema creation or migrations)                                                                           | `Promise<void>`        |
| `withTransaction(fn)`         | Executes multiple operations inside a single SQLite transaction. Automatically commits on success and rolls back if an error is thrown. Nested transactions are not supported. | `Promise<T>`           |

---

## 🏗️ Technical Specification

### Return Type

`Promise<SupastashSQLiteDatabase>`

### Interfaces

The database instance extends a base executor to provide transaction and lifecycle management.

```typescript
interface SupastashSQLiteDatabase extends SupastashSQLiteExecutor {
  closeAsync(): Promise<void>;

  withTransaction<T>(
    fn: (tx: SupastashSQLiteExecutor) => Promise<T> | T
  ): Promise<T>;
}

interface SupastashSQLiteExecutor {
  runAsync(sql: string, params?: readonly unknown[]): Promise<void>;
  getAllAsync<T = any>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  getFirstAsync<T = any>(
    sql: string,
    params?: readonly unknown[]
  ): Promise<T | null>;
  execAsync(statements: string): Promise<void>;
}
```

---

## ✅ Usage Examples

### 1. Basic Query

```typescript
const db = await getSupastashDb();

await db.runAsync(
  `INSERT INTO orders (id, customer_name, total_amount, created_at)
   VALUES (?, ?, ?, ?)`,
  ["1", "John Doe", 150, new Date().toISOString()]
);
```

### 2. Running a Transaction

```typescript
const db = await getSupastashDb();

await db.withTransaction(async (tx) => {
  await tx.runAsync(
    `INSERT INTO orders (id, customer_name, total_amount, created_at)
     VALUES (?, ?, ?, ?)`,
    ["1", "Jane", 200, new Date().toISOString()]
  );

  await tx.runAsync(
    `INSERT INTO order_items (id, order_id, product_name, quantity, price)
     VALUES (?, ?, ?, ?, ?)`,
    ["10", "1", "Premium Shirt", 2, 100]
  );
});
```

---

## ⚠️ Critical Rules

| Rule                  | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| **No Nesting**        | Do not call `db.withTransaction` inside another transaction block.           |
| **No Mixing**         | Never use `rawDb.execute()` alongside Supastash executors in the same block. |
| **No Manual Control** | Do not manually call `COMMIT` or `ROLLBACK`. The adapter handles this.       |

---

## 🚀 Performance & Reliability

- **Batching:** Always batch writes inside a transaction. Without them, 10,000 inserts can be **10–50× slower**.
