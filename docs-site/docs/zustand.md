## 🔁 Zustand Store Auto-Hydration via Supastash Events

Supastash emits **automatic refresh events** for tables whenever local changes occur — whether from syncing, user updates, or mutations. These events allow you to **hydrate your Zustand stores** (or any state container) with fresh data without having to manually track when something changed.

You don’t need to call anything — just **subscribe to the right event and update your store**.

---

### 🧠 Why This Matters

In local-first apps, keeping your UI in sync with the local database is essential. But polling or manually reloading data on every change is inefficient and error-prone.

Supastash solves this with:

- ✅ **Internal refresh tracking**
- 🔁 **Debounced event emissions**
- 🧵 **Per-table precision**
- 🔌 **Zustand-ready integration**

---

### 🚨 The Supastash Event Format

Whenever a table changes (via local insert/update/delete), Supastash emits:

```ts
const ZUSTAND_PREFIX = "supastash:refreshZustand:";
```

So for the `sales` table, this emits:

```ts
"supastash:refreshZustand:sales";
```

You can subscribe to this with:

```ts
supastashEventBus.on("supastash:refreshZustand:sales", hydrateSales);
```

---

### 🔨 How to Hydrate Zustand on Change

Create a reusable hook to **automatically subscribe** to refresh events and **rehydrate stores**:

```ts
import { useEffect } from "react";
import { supastashEventBus } from "supastash";

const ZUSTAND_PREFIX = "supastash:refreshZustand:";

const HYDRATE_HANDLERS = {
  sales: async () => {
    await useSalesStore.getState().hydrateSales();
  },
  customers: async () => {
    await useCustomersStore.getState().hydrateCustomers();
  },
  // Add more table hydration handlers here...
};

export function useHydrateStores() {
  useEffect(() => {
    for (const [table, handler] of Object.entries(HYDRATE_HANDLERS)) {
      const event = `${ZUSTAND_PREFIX}${table}`;
      supastashEventBus.on(event, handler);
    }

    return () => {
      for (const [table, handler] of Object.entries(HYDRATE_HANDLERS)) {
        const event = `${ZUSTAND_PREFIX}${table}`;
        supastashEventBus.off(event, handler);
      }
    };
  }, []);
}
```

---

### 🧪 How to Use `useHydrateStores`

You can call it anywhere—in your app layout, a specific navigator, or even an individual.

```ts
export default function AppLayout() {
  useHydrateStores();

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

You can also scope it to specific screens if needed.

---

### 💧 What Does a `hydrate` Function Do?

Each hydrate function is just a **data fetch + Zustand update**:

```ts
import { create } from "zustand";

const prevLimit = 100;

export const useSalesStore = create((set) => ({
  sales: [],
  hydrateSales: async (newLimit = prevLimit) => {
    const { data: sales } = await supastash
      .from("sales")
      .select("*")
      .is("deleted_at", null)
      .limit(newLimit)
      .run();

    if (sales) set({ sales });
  },
}));
```

> You can narrow results using `.eq("shop_id", currentShopId)` or `.gt("updated_at", lastFetched)`.

---

### ⚙️ Too Many Listeners?

If you're listening to many tables and notice a **MaxListenersExceededWarning**, you can safely raise the listener limit.

Use `configureSupastash()` to increase it:

```ts
configureSupastash({
  // ...other config
  listeners: 500, // increase from default 250
});
```

This ensures your app doesn't run into limits as more tables or hooks subscribe to refresh events.

---

### ✅ Benefits of This Pattern

| Feature                    | Benefit                                         |
| -------------------------- | ----------------------------------------------- |
| 🔁 Auto-refresh            | Always fresh data after sync or local change    |
| 🧼 Centralized hydration   | No scattered refresh logic                      |
| ⚡ Efficient and debounced | Won’t over-fetch or re-render too often         |
| 🧩 Easy to extend          | Add any new table by wiring one `hydrateX()`    |
| 🤝 Works with Zustand      | Or any other state system (Valtio, Jotai, etc.) |

---

### ✅ TL;DR

- Supastash emits per-table refresh events like `supastash:refreshZustand:sales`
- You can hook into them using `supastashEventBus`
- Hydrate your Zustand store with fresh local data using `.select().run()`
- Everything is **debounced**, scoped, and efficient by design
- Use `useHydrateStores()` at the top level of your app to enable all hydration events
