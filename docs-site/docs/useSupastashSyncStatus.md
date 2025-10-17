# 🧭 useSupastashSyncStatus

`useSupastashSyncStatus(debounceMs?)` gives you **live visibility** into Supastash's sync process — both **push** (local → server) and **pull** (server → local).

Use it to show syncing banners, badges, progress indicators, or "last synced" timestamps in your UI.

---

## 🔍 Overview

This hook subscribes to Supastash's internal event bus and returns two reactive values:

| Key          | Type                               | Description                                               |
| ------------ | ---------------------------------- | --------------------------------------------------------- |
| `syncStatus` | `"pending" \| "error" \| "synced"` | Overall sync summary across all tables                    |
| `syncInfo`   | [`SyncInfo`](#-syncinfo-structure) | Detailed per-table sync info, including progress and logs |

### Parameters

| Parameter    | Type                | Default | Description                                  |
| ------------ | ------------------- | ------- | -------------------------------------------- |
| `debounceMs` | `number` (optional) | `40`    | Milliseconds to debounce sync status updates |

> ⏱️ Updates are **debounced (40 ms by default)** to prevent unnecessary re-renders when sync events fire rapidly. You can customize this value based on your needs.

---

## ⚙️ Example

```tsx
import { useSupastashSyncStatus } from "supastash";

export function SyncBanner() {
  const { syncStatus, syncInfo } = useSupastashSyncStatus();

  if (syncStatus === "pending") return <Banner text="Syncing changes…" />;
  if (syncStatus === "error")
    return <Banner text="Sync error — tap to retry" />;
  if (syncStatus === "synced") return <Banner text="All data synced ✅" />;

  return null;
}
```

You can also show progress:

```tsx
const progress = Math.round(
  (syncInfo.push.tablesCompleted / syncInfo.push.numberOfTables) * 100
);

<Text>Push Sync Progress: {progress}%</Text>;
```

---

## 🧠 SyncInfo Structure

```tsx
{
  pull: {
    inProgress: boolean;
    numberOfTables: number;
    tablesCompleted: number;
    currentTable: {
      name: string;
      unsyncedDataCount: number;
      unsyncedDeletedCount: number;
    };
    lastSyncedAt: number;
    lastSyncLog: SyncLogEntry[];
  };
  push: {
    inProgress: boolean;
    numberOfTables: number;
    tablesCompleted: number;
    currentTable: {
      name: string;
      unsyncedDataCount: number;
      unsyncedDeletedCount: number;
    };
    lastSyncedAt: number;
    lastSyncLog: SyncLogEntry[];
  };
}
```

Each section (pull / push) tracks its own progress, logs, and last sync timestamp.

---

## 📦 Returned Values

| Name            | Type                               | Description                           |
| --------------- | ---------------------------------- | ------------------------------------- |
| `syncStatus`    | `"pending" \| "error" \| "synced"` | Overall sync health across all tables |
| `syncInfo.pull` | `SyncInfoItem`                     | Details for pull operations           |
| `syncInfo.push` | `SyncInfoItem`                     | Details for push operations           |

---

## 💡 Common Use Cases

- Display "Syncing…" or "Offline changes pending" banners.
- Disable UI actions while push or pull is in progress.
- Show a timestamp of when data was last synced.
- Track per-table progress in a developer dashboard or diagnostics screen.

---

## ⚠️ Notes

- The hook is safe to use anywhere in your app — it's globally reactive.
- It automatically subscribes and unsubscribes from Supastash's event bus.
- Updates are debounced (40 ms) for performance; you'll get near-realtime info without flicker.
- This hook does not trigger sync — it only observes state.

---

## ✅ Summary

`useSupastashSyncStatus()` is your window into Supastash's sync engine — giving you live, reliable feedback on what's happening behind the scenes.
