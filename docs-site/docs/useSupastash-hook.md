# Initializing Supastash

## 🧩 `useSupastash`

```ts
function useSupastash(): {
  dbReady: boolean;
  startSync: () => void;
  stopSync: () => void;
};
```

### Overview

`useSupastash` is the main React hook for initializing and managing Supastash. It takes care of:

#### Responsibilities

- 📦 **SQLite Setup**: Initializes sync metadata tables.
- ⚙️ **Schema Init Hook**: Runs your custom schema setup (e.g., table creation) via `onSchemaInit`
- 🔁 **Sync Engine**:

  - Pushes local changes to Supabase
  - Optionally pulls new data from Supabase based on polling interval
  - Automatically triggers sync on app foreground (via `AppState`)
  - Prevents overlapping sync cycles

This is the **only hook** you need to call during app startup to get the local-first sync system running.

---

### Returns

| Property    | Type         | Description                                                         |
| ----------- | ------------ | ------------------------------------------------------------------- |
| `dbReady`   | `boolean`    | Indicates whether Supastash has completed setup and is ready to use |
| `startSync` | `() => void` | Manually starts the background sync interval                        |
| `stopSync`  | `() => void` | Stops syncing and cleans up timers and listeners                    |

---

### Example

```ts
// _layout.tsx or App.tsx (entry layout)
const { dbReady, startSync, stopSync } = useSupastash();

if (!dbReady) return null;
```

---

### Internal Behavior (What Happens Under the Hood)

1. **Config Validation**

   - Checks if `supabaseClient`, `sqliteClient`, and `sqliteClientType` are present in the config.
   - Logs meaningful errors and disables further setup if missing.

2. **Table Setup**

   - Creates sync log tables.
   - Runs your custom `onSchemaInit()` callback, if provided.

3. **Sync Logic**

   - Starts the sync engine.
   - Adds an `AppState` listener to trigger a **forced sync** when the app is foregrounded.

4. **Sync Safety**

   - Avoid concurrent syncs
   - Checks if device is online before syncing to avoid unnecessary errors

---

### Notes

- You can manually control sync with `startSync()` and `stopSync()` if needed (e.g., after user login or logout).
- Sync runs in the background and is resilient to intermittent network failures.
- Pull sync is optionally — you must explicitly enable `syncEngine.pull = true` in the Supastash config.

### 🔗 Other docs?

- [Data Access docs](./data-access.md)
- [useSupastash docs](useSupastash-hook.md)
- [Query Builder docs](./supastash-query-builder.md)
