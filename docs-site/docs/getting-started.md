# 🚀 Getting Started with Supastash

## Installation

```bash
npm install supastash
```

### 📎 Required Peer Dependencies

You MUST install the following manually.

```bash
npm install @supabase/supabase-js
             @react-native-community/netinfo
             react
             react-native

```

### 🗃️ Choose one SQLite adapter.

Depending on your setup, install only one.

```bash
# For Expo
npm install expo-sqlite

# For bare React Native with better performance
npm install react-native-nitro-sqlite

# Or classic SQLite option
npm install react-native-sqlite-storage
```

---

## ⚙️ Setup

### 1. Configure Supastash

This should be done early (e.g., in lib/supastash.ts). [Supastash configuration docs](./configuration.md)

```ts
// lib/supastash.ts
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";
import { openDatabaseAsync } from "expo-sqlite";

configureSupastash({
  supabaseClient: supabase,
  dbName: "supastash_db",
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo", // or "rn-nitro" or "rn-storage"

  onSchemaInit: () => {
    // Define your local schema here. You can include this is a separate file, then call it here.
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

  debugMode: true, // useful for logging
  syncEngine: {
    push: true,
    pull: false, // ⚠️ Pull sync is disabled by default. It will pull unfiltered data from the server. Enable RLS if you want to pull filtered data.
  },
});
```

### 2. Initialize Supastash(in your entry layout)

```ts
// _layout.tsx or App.tsx (entry layout)
import "@/lib/supastash";

export default function RootLayout() {
  return <Stack />;
}
```

### 3. Enable RLS Support (Server-Side Setup)

Supastash uses a helper RPC function to fetch column metadata, which is essential for syncing.

To set it up, run the SQL function below in the **Supabase SQL Editor (Server-side)**.

```sql
create or replace function get_table_schema(table_name text)
returns table(
  column_name text,
  data_type text,
  is_nullable text
)
security definer
as $$
  select
    column_name,
    data_type,
    is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = $1;
$$ language sql;

grant execute on function get_table_schema(text) to anon, authenticated;
```

This allows Supastash to access column details for public tables — even when **Row-Level Security (RLS)** is enabled.

> ⚠️ **Important:**  
> All Supabase timestamp columns used for syncing — such as `created_at`, `updated_at` and `deleted_at` — **must be of type `timestamptz`** (timestamp with time zone).  
> This ensures consistent comparisons across devices and avoids missing records due to timezone mismatches.

### 4. Enable [Sync Engine(Client-Side Setup)](useSupastash-hook.md)

This hook prepares the sync engine. Place this before rendering the rest of your app.

```ts
import { useSupatash } from "supastash";

const { dbReady } = useSupatash();
if (!dbReady) return null;
return <Stack />;
```

## 🧪 Basic Usage

### [`useSupatashData`](./data-access.md) Local-First React Hook

This hook fetches and subscribes to local SQLite data, keeping it synced in the background.

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

### `useSupatashData` with 🔍 Filtering

```ts
import { useSupatashData } from "supastash";

type Order = {
  id: string;
  user_id: string;
  deleted_at: string | null;
  updated_at: string;
  created_at: string;
};

// Filtered
const { userId } = useAuth(); // assume you're managing auth
const { data: userOrders } = useSupatashData<Order>("orders", {
  filter: { column: "user_id", operator: "eq", value: userId },
  shouldFetch: !!userId, // prevents query if no userId yet
});
```

- data – Array of rows
- dataMap – Keyed by id, useful for constant-time lookups
- Automatically stays in sync with local writes
- Pushes changes to Supabase

---

### [`supastash`](./supastash-query-builder.md) – Supabase Query Builder

A thin wrapper around `supabase.from(...)` that fits seamlessly with Supastash’s local-first approach. Best used for direct, one-off queries to the server.

```ts
import { supastash } from "supastash";

const [orders, setOrders] = useState([]);

useEffect(() => {
  const fetchOrders = async () => {
    const { data, error } = await supastash.from("orders").select("*").run();
    if (error) {
      console.error(error);
      return;
    }
    setOrders(data);
  };

  fetchOrders();
}, []);

return <Text>{JSON.stringify(orders)}</Text>;
```

---

### 🔗 What’s Next?

- [Configuration docs](./configuration.md)
- [Data Access docs](./data-access.md)
- [useSupastash docs](useSupastash-hook.md)
- [Query Builder docs](./supastash-query-builder.md)
