# Supastash

**Offline-First Sync Engine for Supabase + React Native.**

Supastash makes it effortless to build offline-capable mobile apps using **SQLite for local-first storage** and **Supabase for cloud sync**. Designed for React Native, Supastash handles syncing, conflict resolution, realtime updates, and local querying so you can focus on features, not infrastructure.

---

### 📚 Documentation

[Documentation (Coming Soon)](https://...)

---

## 🚀 Features

- 🔁 **Two-way sync** with Supabase
- 💾 **Local-first querying** with React Native SQLite
- ⚡ **Realtime updates** using Supabase channels
- 🔌 **Pluggable SQLite adapters** (`expo-sqlite`, `react-native-nitro-sqlite`, `react-native-sqlite-storage`)
- ✅ **Built-in deduplication**, conflict resolution, and background retries
- 🧠 Designed to support **event batching**, **job staging**, and fine-grained sync control

---

## 📦 Installation

```bash
npm install supastash
# or
yarn add supastash
```

### 📎 Peer Dependencies (You MUST install these)

```bash
npm install @supabase/supabase-js
             @react-native-community/netinfo
             react
             react-native

# Choose one SQLite adapter:
npm install expo-sqlite
# or
npm install react-native-nitro-sqlite
# or
npm install react-native-sqlite-storage
```

> `sqliteClientType` must match your adapter: "expo", "rn-nitro", or "rn-storage"

---

## ⚙️ Setup

```ts
// lib/supastash.ts
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";
import { openDatabaseAsync } from "expo-sqlite";

configureSupastash({
  supabaseClient: supabase,
  dbName: "supastash_db",
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo",
  onSchemaInit: () => {
    defineLocalSchema(
      "users",
      {
        id: "TEXT PRIMARY KEY",
        name: "TEXT",
        email: "TEXT",
        created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      },
      true
    );
  },
  debugMode: true,
  syncEngine: {
    push: true,
    pull: false, // ⚠️ Pull sync is disabled by default.
  },
});
```

Then initialize early:

```ts
// _layout.tsx or App.tsx
import "@/lib/supastash";

export default function RootLayout() {
  return <Stack />;
}
```

---

## 🚨 Key Notes

- Supabase tables **must** include:

  - `id`, `created_at`, `updated_at`, `deleted_at`
  - Use `updated_at` for conflict resolution
  - Avoid null primary keys
  - Apply `deleted_at IS NULL` filter in queries

- To enable schema reflection, create this Supabase RPC:

```sql
create or replace function get_column_names(table_name text)
returns table(column_name text)
security definer
as $$
  select column_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = table_name;
$$ language sql;

grant execute on function get_column_names(text) to anon, authenticated;
```

---

## 🧪 Basic Usage

### `useSupatashData` hook

```ts
import { useSupatashData } from "supastash";

type Order = {
  id: string;
  user_id: string;
  deleted_at: string | null;
  updated_at: string;
  created_at: string;
};

const { data: orders, dataMap: ordersMap } = useSupatashData<Order>("orders");

// Filtered
const { userId } = useAuth();
const { data: userOrders } = useSupatashData<Order>("orders", {
  filter: { column: "user_id", operator: "eq", value: userId },
  shouldFetch: !!userId,
});
```

### `useSupatash`

```ts
import { useSupatash } from "supastash";

const { dbReady } = useSupatash();
if (!dbReady) return null;
return <Stack />;
```

---

## 📘 API Overview

### `configureSupastash(config)`

Initialize sync system.

### `useSupatashData(table, options)`

Access data with local cache, syncing, filtering, etc.

Returns:

```ts
{
  data: R[];
  dataMap: Map<string, R>;
  trigger: () => void;
  cancel: () => void;
}
```

### `refreshTable(table: string)` / `refreshAllTables()`

Force-refresh any or all table data.

---

## 🔄 Sync Internals

- Safe writes with `created_at`, `updated_at`, `deleted_at`
- Retries with **exponential backoff**
- Batched inserts, updates, deletes
- Real-time changes are applied directly to local cache

---

## 📁 Project Structure

```
src/
  ├─ core/         # Supabase + sync logic
  ├─ hooks/        # Main React hooks
  ├─ types/        # Type definitions
  ├─ utils/        # Helper utilities
```

---

## 🔧 Testing

```bash
yarn test
```

Uses `vitest` for unit testing.

---

## 🧱 Roadmap

- [ ] Per-table sync intervals
- [ ] Smart job resumption
- [ ] Sync versioning
- [ ] Live change audit logs

---

## 🤝 Contributing

```bash
yarn dev
```

Open a PR with tests and typed signatures. PRs welcome.

---

## 📜 License

MIT License © Ezekiel Akpan

---

## 💬 Questions?

Open an issue or reach out on [X @0xZekeA](https://x.com/0xZekeA)
