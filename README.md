# Supastash

[![npm version](https://img.shields.io/npm/v/supastash.svg)](https://www.npmjs.com/package/supastash)

**Offline-First Sync Engine for Supabase + React Native & Desktop**

> Supastash syncs your Supabase data with SQLite — live, offline, and conflict-safe. No boilerplate. Built for React Native, Expo, and (experimentally) Tauri desktop apps.

---

## 📚 Documentation

→ [Full Docs](https://0xzekea.github.io/supastash/)  
→ [Getting Started Guide](./docs/getting-started.md)

---

> 🔴 **NEW — Replication Mode**
>
> Improves sync ordering and prevents missed updates in distributed offline systems.  
> ⚠️ Must read if your app supports multiple devices or long offline sessions.
>
> 👉 Learn more: https://0xzekea.github.io/supastash/docs/replication-mode

> 🖥️ **NEW (v2.0.1+, experimental) — Desktop Support via Tauri**
>
> Supastash now works in Tauri desktop apps using the `tauri-plugin-sql` adapter.  
> Same sync engine, same API — now available beyond mobile.  
> ⚠️ Desktop support is experimental. Expect rough edges and breaking changes.

---

## ✨ Features

- 🔁 **Two-way sync** (Supabase ↔ SQLite)
- 💾 **Offline-first** querying with local cache
- ⚡ **Realtime updates** (INSERT, UPDATE, DELETE)
- 🔌 Compatible with all major SQLite clients:

  - `expo-sqlite`
  - `react-native-nitro-sqlite`
  - `react-native-sqlite-storage` (beta)
  - `tauri-plugin-sql` (desktop, experimental)

- 🧠 Built-in:

  - Conflict resolution
  - Sync retries
  - Batched updates
  - Row-level filtering
  - Staged job processing

---

## 📦 Installation

```bash
npm install supastash
```

### ➕ Required Peer Dependencies

```bash
npm install @supabase/supabase-js \
             @react-native-community/netinfo \
             react \
             react-native
```

> **Breaking change (v2.0.1+):** You must now pass `networkAdapter: NetInfo` explicitly in `configureSupastash`. Import it as:
>
> ```ts
> import * as NetInfo from "@react-native-community/netinfo"; // React Native only
> ```
>
> For Tauri desktop apps, `networkAdapter` is not required — network detection is handled natively.

### 🧱 Choose a SQLite Adapter

Choose **only one**, based on your stack:

```bash
# Expo (most common)
npm install expo-sqlite

# Bare RN with better speed
npm install react-native-nitro-sqlite

# Classic RN SQLite (beta)
npm install react-native-sqlite-storage
```

> Match with `sqliteClientType`: `"expo"`, `"rn-nitro"`, `"rn-storage"`, or `"tauri"` (experimental)

---

## ⚙️ Quick Setup

### 1. Configure Supastash

```ts
// lib/supastash.ts
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";
import { openDatabaseAsync } from "expo-sqlite"; // or your adapter
import * as NetInfo from "@react-native-community/netinfo"; // react-native only

configureSupastash({
  supabaseClient: supabase,
  dbName: "supastash_db",
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo",
  networkAdapter: NetInfo,

  onSchemaInit: () => {
    defineLocalSchema("users", {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
      email: "TEXT",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
    });
  },

  debugMode: true,
  syncEngine: {
    push: true,
    pull: false, // enable this if using filters or RLS
  },
  excludeTables: {
    push: ["daily_reminders"],
    pull: ["daily_reminders"],
  },
});
```

### 2. Initialize Once

```ts
// App.tsx or _layout.tsx
import "@/lib/supastash"; // triggers init
import { useSupatash } from "supastash";

export default function App() {
  const { dbReady } = useSupatash();
  if (!dbReady) return null;
  return <Stack />;
}
```

---

### 🧠 Optional: Zustand Auto-Hydration

To auto-update Zustand stores when local data changes, listen for refresh events:

```ts
supastashEventBus.on("supastash:refreshZustand:orders", hydrateOrders);
```

Use this in a hook like `useHydrateStores()` to stay in sync without polling.
👉 **[Read Docs](https://0xzekea.github.io/supastash/docs/zustand)**

---

### 🔁 `useSupastashData` (with Realtime)

```ts
const { data, groupedBy } = useSupastashData("orders", {
  filter: { column: "user_id", operator: "eq", value: userId },
  extraMapKeys: ["status"],
  realtime: true, // Default: true
});
```

- ✅ Auto-syncs with Supabase Realtime
- ✅ Keeps your UI in sync automatically
- ✅ Ideal for dashboards, chat, shared data

---

### 🛡️ Use Filters for Pull Syncing

If you use `pull: true`, you **must** define filters per table:

```ts
useSupastashFilters({
  orders: [{ column: "shop_id", operator: "eq", value: activeShopId }],
  inventory: [{ column: "location_id", operator: "eq", value: location }],
});
```

> Without filters or RLS, Supastash may try to pull full tables — which could lead to empty results or large sync payloads.

---

## 🚨 Important Notes

- Your Supabase tables must have:

  - A primary key `id` (string or UUID)

  - `timestamptz` columns for `created_at`, `updated_at`, and `deleted_at`
  - If using `replicationMode: "server-side"`(Recommended), you must also add:
    - `arrived_at timestamptz NOT NULL DEFAULT now()`
    - A server trigger to enforce `arrived_at` updates
  - Run this SQL in Supabase to allow schema reflection:

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

const { data: orders } = useSupatashData("orders", {
  filter: { column: "user_id", operator: "eq", value: userId },
});
```

---

## 🔄 How Sync Works

- Tracks rows using a replication cursor (`updated_at` by default, or `arrived_at` in server-side mode)
- Batches changes in background and retries failed ones
- Local cache backed by Supabase
- Runs pull/push jobs efficiently using staged task pipelines

---

## 🧠 Advanced Querying (Optional)

Supastash includes a built-in query builder:

```ts
await supastash
  .from("orders")
  .update({ status: "delivered" })
  .syncMode("localFirst") // localOnly, remoteOnly also available
  .run();
```

---

## 🔧 API Docs

- [`configureSupastash()`](https://0xzekea.github.io/supastash/docs/configuration)
- [`useSupatashData()`](https://0xzekea.github.io/supastash/docs/useSupastashData)
- [`useSupastashFilters()`](https://0xzekea.github.io/supastash/docs/useSupastashFilters)
- [`supastash.from(...).run()`](https://0xzekea.github.io/supastash/docs/supastash-query-builder)

---

## 🤝 Contributing

PRs are welcome! Please write clear commit messages and add tests when relevant.

---

## 📜 License

MIT © [Ezekiel Akpan](https://x.com/0xZekeA)

---

## 💬 Need Help?

Open an issue or reach out on [Twitter/X](https://x.com/0xZekeA)

---
