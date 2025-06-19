# 🚀 Getting Started with Supastash

Supastash helps you build **offline-first apps** by syncing local SQLite data with Supabase in the background. This guide walks you through setting it up from scratch.

---

## 📦 Installation

### 1. Install Supastash

```bash
npm install supastash
```

### 2. Install Required Peer Dependencies

These are required and **must be installed manually**:

```bash
npm install @supabase/supabase-js \
             @react-native-community/netinfo \
             react \
             react-native
```

### 3. Choose a SQLite Adapter (Only ONE)

Choose based on your project type:

```bash
# For Expo projects
npm install expo-sqlite

# For better performance in bare React Native
npm install react-native-nitro-sqlite

# Or use the classic SQLite option
npm install react-native-sqlite-storage
```

---

## ⚙️ Project Setup

### 1. Create the Supastash Config

Setup early in your app — e.g., `lib/supastash.ts`

```ts
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";
import { openDatabaseAsync } from "expo-sqlite"; // or nitro/sqlite-storage client

configureSupastash({
  supabaseClient: supabase,
  dbName: "supastash_db",
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo", // or "rn-nitro" / "rn-storage"

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
    pull: false, // Enable if using RLS and want to pull filtered data
  },
});
```

### 2. Initialize It Once (in your main layout)

```ts
// App.tsx or _layout.tsx
import "@/lib/supastash"; // Just import to initialize

export default function App() {
  return <Stack />; // or your main app entry
}
```

---

## 🛡️ Server-Side Setup for RLS

Supastash needs access to your table schema. Run this **SQL function** in the Supabase SQL Editor:

```sql
create or replace function get_table_schema(table_name text)
returns table(
  column_name text,
  data_type text,
  is_nullable text
)
security definer
as $$
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = $1;
$$ language sql;

grant execute on function get_table_schema(text) to anon, authenticated;
```

> ✅ This works with **Row-Level Security (RLS)**. Without this, Supastash can't sync filtered data.

### Important Timestamp Rule

All timestamp columns used for syncing — like `created_at`, `updated_at`, `deleted_at` — **must be `timestamptz`** (timestamp with time zone).

This prevents timezone issues and ensures reliable sync.

---

## ⚙️ Bootstrapping the Sync Engine

Before rendering your app, make sure the Supastash engine is ready:

```ts
import { useSupatash } from "supastash";

const { dbReady } = useSupatash();
if (!dbReady) return null;
return <Stack />;
```

---

## 🧪 Basic Hook Usage: [`useSupatashData`](data-access.md)

This hook gives you live local-first data access.

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
```

You get:

- `data` – An array of rows
- `dataMap` – A map keyed by ID for fast lookup

Supastash keeps this in sync with SQLite and Supabase.

---

## 🔍 With Filtering

Only fetch rows for a specific user:

```ts
import { useSupatashData } from "supastash";

const { userId } = useAuth();
const { data: userOrders } = useSupatashData("orders", {
  filter: {
    column: "user_id",
    operator: "eq",
    value: userId,
  },
  shouldFetch: !!userId,
});
```

This ensures you don’t load data until the `userId` is available.

---

## 🔧 Querying Supabase Directly

Use `supastash.from()` for one-off server queries (like `supabase.from(...)` but integrated with Supastash):

```ts
import { supastash } from "supastash";

useEffect(() => {
  const fetchOrders = async () => {
    const { data, error } = await supastash.from("orders").select("*").run();
    if (error) console.error(error);
    else setOrders(data);
  };

  fetchOrders();
}, []);
```

---

## 🧠 Next Steps

- [Configuration Guide](./configuration.md)
- [Data Access Hook (`useSupatashData`)](./data-access.md)
- [Sync Engine Setup (`useSupatash`)](./useSupastash-hook.md)
- [Supastash Query Builder](./supastash-query-builder.md)

---

That’s it! You’re now set up to build offline-first, realtime-ready apps with Supastash.
