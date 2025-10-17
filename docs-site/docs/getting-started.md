# 🚀 Getting Started with Supastash

Supastash helps you build **offline-first apps** by syncing local SQLite with Supabase — all in the background.
Whether you're building a point-of-sale, chat, delivery, or CRM app, Supastash gives you **control, performance, and reliability** even when users are offline.

This guide walks you through setting it up from scratch.

---

## 📦 Installation

### 1. Install Supastash

```bash
npm install supastash
```

### 2. Install Required Peer Dependencies

These must be installed manually:

```bash
npm install @supabase/supabase-js \
             @react-native-community/netinfo \
             react \
             react-native
```

### 3. Choose ONE SQLite Adapter

Pick the adapter based on your project setup:

```bash
# For Expo projects
npm install expo-sqlite

# For bare React Native (better performance)
npm install react-native-nitro-sqlite

# Classic RN SQLite adapter (still in beta)
npm install react-native-sqlite-storage
```

---

## ⚙️ Project Setup

### 1. Configure Supastash

Set this up early — e.g., `lib/supastash.ts`

```ts
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";
import { openDatabaseAsync } from "expo-sqlite"; // or your adapter

configureSupastash({
  supabaseClient: supabase,
  dbName: "supastash_db",
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo", // "rn-nitro" or "rn-storage"

  onSchemaInit: () => {
    defineLocalSchema("users", {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
      email: "TEXT",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      __indices: ["email", "user_id"],
    });
  },

  debugMode: true,
  syncEngine: {
    push: true,
    pull: false, // Enable if you're using RLS or useSupastashFilters
  },
  excludeTables: {
    push: ["daily_reminders"],
    pull: ["daily_reminders"],
  },
});
```

---

### 2. Initialize Once in Your App

```ts
// App.tsx or _layout.tsx
import "@/lib/supastash"; // Triggers initialization

export default function App() {
  return <Stack />; // or your app shell
}
```

---

## 🛡️ Server-Side Setup (for Filtered Pulls)

To enable safe, filtered data pulling from Supabase, run this SQL function:
✅ **This is Required**

```sql
create or replace function get_table_schema(table_name text)
returns table(column_name text, data_type text, is_nullable text)
security definer
as $$
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = $1;
$$ language sql;

grant execute on function get_table_schema(text) to anon, authenticated;
```

⚠️ Make sure all sync-related timestamps (`created_at`, `updated_at`, `deleted_at`) use `timestamptz` — not plain `timestamp` to avoid timezone drift, inconsistent sync ordering, and data mismatches across devices. .

---

## ⚙️ Wait for Initialization Before Rendering

```ts
import { useSupatash } from "supastash";

const { dbReady } = useSupatash();
if (!dbReady) return null;

return <AppRoutes />;
```

---

### 🧠 Optional: Zustand Auto-Hydration

If you're using Zustand for state management, you can **automatically sync your stores** with local Supastash data — no need to manually reload after every change.

Whenever a table like `orders` is updated (via sync or local change), Supastash emits:

```ts
supastashEventBus.on("supastash:refreshZustand:orders", () => {
  // Your hydrate call
});
```

This allows you to call your Zustand store's `hydrateOrders()` method to fetch the latest local data.

✅ Tip: Set this up in a reusable hook like `useHydrateStores()` so your app stays up-to-date in the background.

👉 **[Read integration with zustand](zustand.md)** for full examples and best practices.

---

## 📡 Data Fetching Options

Supastash gives you [`useSupastashData`](useSupastashData.md) for fetching and syncing local data:

---

### 🧠 [`useSupastashData`](useSupastashData.md) – Full Sync, Realtime-Aware

```ts
const { data, dataMap, groupedBy } = useSupastashData("orders", {
  filter: { column: "user_id", operator: "eq", value: userId },
  extraMapKeys: ["status"],
});
```

- Syncs with Supabase in **realtime**
- Uses **global cache**
- Automatically keeps state synced
- Best for dashboards, shared state, live data

---

## 🧩 Dynamic Filtering (All Hooks)

Supastash lets you filter synced data based on user, shop, etc.

```ts
const { data } = useSupastashData("orders", {
  filter: {
    column: "user_id",
    operator: "eq",
    value: currentUserId,
  }, // RealtimeFilter
  sqlFilter: [{ column: "user_id", operator: "eq", value: currentUserId }], //sql (optional)
});
```

> 💡 `filter` = for Supabase realtime
> 💡 `sqlFilter` = for actual query filtering

---

## 🛡️ Registering Table Filters: [`useSupastashFilters`](useSupastashFilters.md)

If you’re pulling data (i.e., using `pull: true` in [`configureSupastash`](configuration.md)), always call this hook at startup:

```ts
useSupastashFilters({
  orders: [{ column: "shop_id", operator: "eq", value: activeShopId }],
  inventory: [
    { column: "location_id", operator: "eq", value: selectedLocation },
  ],
});
```

- Ensures only **scoped rows** are pulled from Supabase
- Prevents unnecessary or insecure full-table syncs
- Validates your filters and warns you if anything’s wrong

---

## 🔍 One-Off Queries with Supabase

Use Supastash's built-in wrapper for direct Supabase access:

```ts
import { supastash } from "supastash";

const { data, error } = await supastash.from("orders").select("*").run();
```

It works just like `supabase.from(...)`, but ensures it respects your Supastash config.

---

## 🔧 Debugging

Enable `debugMode: true` to log sync events, retries, or failures:

```ts
configureSupastash({
  ...,
  debugMode: true,
});
```

---

## ✅ Next Steps

- [useSupastashData Docs](./useSupastashData.md)
- [Zustand integration](./zustand.md)
- [useSupastashFilters Docs](./useSupastashFilters.md)
- [Query Builder](./supastash-query-builder.md)
- [Advanced Schema Setup](./schema-management.md)

---

That’s it — you're now ready to build **offline-first**, **scalable**, and **Supabase-powered** apps using Supastash.
