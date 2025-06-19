# Supastash

**Offline-First Sync Engine for Supabase + React Native**

> Sync local SQLite data with Supabase in real-time — even when your app is offline. Built for React Native, no boilerplate required.

Supastash gives your app **instant offline access**, **two-way syncing**, and **real-time updates** — all while letting you work with local data as the source of truth.

---

## 📚 **[Read the Full Docs »](https://0xzekea.github.io/supastash/)**

---

## ✨ Features

- 🔁 Two-way sync with Supabase
- 💾 Local-first querying via SQLite
- ⚡ Realtime updates (INSERT, UPDATE, DELETE)
- 🔌 Works with any SQLite adapter (`expo-sqlite`, `rn-nitro`, `sqlite-storage`)
- 🧠 Handles conflict resolution, batching, retries
- 🧩 Supports filtering, job staging, and advanced sync control

---

## 📦 Installation

```bash
npm install supastash
```

### Required Peer Dependencies

```bash
npm install @supabase/supabase-js \
             @react-native-community/netinfo \
             react react-native
```

### Choose one SQLite adapter:

```bash
# Expo
npm install expo-sqlite

# React Native Nitro (faster)
npm install react-native-nitro-sqlite

# Or classic storage
npm install react-native-sqlite-storage
```

> Match with: `"sqliteClientType": "expo"`, `"rn-nitro"`, or `"rn-storage"`

---

## ⚙️ Quick Setup

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
        created_at: "TIMESTAMP",
        updated_at: "TIMESTAMP",
      },
      true
    );
  },

  debugMode: true,
  syncEngine: {
    push: true,
    pull: false, // enable if using RLS
  },
});
```

Then in your root layout:

```ts
// App.tsx or _layout.tsx
import "@/lib/supastash";

export default function App() {
  return <Stack />;
}
```

---

## 🚨 Important Notes

- Timestamp fields (`created_at`, `updated_at`, `deleted_at`) **must be `timestamptz`** in Supabase
- Every synced table must have a valid `id`
- Create this SQL function in Supabase to allow schema reflection:

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

---

## 🧪 Example: `useSupatashData`

```tsx
import { useSupatashData } from "supastash";

const { data, dataMap } = useSupatashData("orders");
```

Filtered by user:

```tsx
const { userId } = useAuth();
const { data: userOrders } = useSupatashData("orders", {
  filter: { column: "user_id", operator: "eq", value: userId },
  shouldFetch: !!userId,
});
```

Ensure sync engine is ready:

```tsx
import { useSupatash } from "supastash";

const { dbReady } = useSupatash();
if (!dbReady) return null;
```

---

## 🔧 API Overview

- [`configureSupastash()`](https://0xzekea.github.io/supastash/docs/configuration)) – setup + schema
- [`useSupatashData()`](https://0xzekea.github.io/supastash/docs/data-access)) – read/write synced local data

---

## 🔄 How Sync Works

- Tracks changes with `created_at`, `updated_at`, `deleted_at`
- Retries failed syncs with exponential backoff
- Batches realtime + manual changes efficiently
- Keeps local cache as the main source of truth

---

## 🧩 Sync Modes (via query builder)

```ts
supastash
  .from("orders")
  .select("*")
  .syncMode("remoteOnly") // or localOnly, localFirst, remoteFirst
  .run();
```

---

## 🗂 Example Project Structure

```
src/
  ├─ core/         # Config
  ├─ hooks/        # Custom hooks
  ├─ types/        # Type definitions
  ├─ utils/        # Helpers
```

---

## 🧪 Testing & Dev

```bash
# Run tests
yarn test

# Start local dev build
yarn dev
```

---

## 🤝 Contributing

PRs welcome! Please include tests and type signatures.

---

## 📜 License

MIT © Ezekiel Akpan

---

## 💬 Questions?

Open an issue or reach out on [X (Twitter) @0xZekeA](https://x.com/0xZekeA)
