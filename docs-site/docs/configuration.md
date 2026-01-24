# Supastash Configuration

The configureSupastash() function sets up Supastash and must be called **once** at app startup

## Quick Start

```ts
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";
import { openDatabaseAsync } from "expo-sqlite";

configureSupastash({
  dbName: "supastash_db",
  supabaseClient: supabase,
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo",
  debugMode: true,
  onSchemaInit: async () => {
    defineLocalSchema("users", {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
      email: "TEXT",
      created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    });
  },
  // Recommended hardening for name<=20/barcode flows
  syncPolicy: {
    nonRetryableCodes: new Set([
      "23505",
      "23502",
      "23514",
      "23P01",
      "22001",
      "22P02",
    ]),
    onNonRetryable: "accept-server",
  },
});
```

> Call **once at app startup** (before using any hooks).

---

## What’s New (at a glance)

- **Merging rules clarified** for `syncEngine`, `excludeTables`, `pollingInterval`, `syncPolicy`, and `fieldEnforcement`.
- **Conflict behavior flag**: `deleteConflictedRows` (off by default). When `true`, non‑retryable conflicts delete local rows.
- **Policy plumbing**: `DEFAULT_POLICY` and user policy merge; `nonRetryableCodes`/`retryableCodes` are **replaced** if provided (not unioned).
- **Field enforcement block** with sensible defaults and auto‑fill options.

---

## API

### `configureSupastash<T>(config)`

Initializes Supastash. Must be called once.

**Type**: `SupastashConfig<T> & { sqliteClientType: T }`

#### Core options

| Option             | Type                                           | Default          | Notes                                                                                                                         |
| ------------------ | ---------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `dbName`           | `string`                                       | `"supastash_db"` | Name of local SQLite DB.                                                                                                      |
| `supabaseClient`   | `SupabaseClient \| null`                       | **required**     | A configured Supabase client.                                                                                                 |
| `sqliteClient`     | adapter for chosen engine                      | **required**     | Shape depends on `sqliteClientType` (see below).                                                                              |
| `sqliteClientType` | `"expo" \| "rn-storage" \| "rn-nitro" \| null` | **required**     | Selects SQLite engine.                                                                                                        |
| `onSchemaInit`     | `() => Promise<void>`                          | `undefined`      | Optional hook to define local schema with `defineLocalSchema`. Runs once after DB creation.                                   |
| `debugMode`        | `boolean`                                      | `true`           | Verbose logs for sync/DB.                                                                                                     |
| `listeners`        | `number`                                       | `250`            | Max event listeners.                                                                                                          |
| `pushRPCPath`      | `string`                                       | `undefined`      | Path to your custom batch-sync RPC for push operations ([see docs link](./sync-calls.md#-pushrpcpath-custom-batch-sync-rpc)). |

#### Sync switches & intervals

| Option                           | Type      | Default | Notes                                                                                                                                                              |
| -------------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `syncEngine.push`                | `boolean` | `true`  | Push local changes to Supabase.                                                                                                                                    |
| `syncEngine.pull`                | `boolean` | `true`  | **Enabled by default in code**. Only keep on if you’ve secured tables with RLS and/or use [`useSupastashFilters.ts`](./useSupastashFilters.md) for filtered pulls. |
| `syncEngine.useFiltersFromStore` | `boolean` | `true`  | Applies filters captured by hooks to background pulls.                                                                                                             |
| `pollingInterval.pull`           | `number`  | `30000` | ms between pull polls.                                                                                                                                             |
| `pollingInterval.push`           | `number`  | `30000` | ms between push polls.                                                                                                                                             |
| `supabaseBatchSize`              | `number`  | `100`   | Maximum number of rows sent per Supabase write request (insert/upsert). Large payloads are automatically chunked.                                                  |

> **Recommendation**: If your RLS isn’t airtight, set `syncEngine.pull = false` globally and rely on per‑screen filtered pulls via [`useSupastashFilters.ts`](./useSupastashFilters.md).

#### Table selection

| Option               | Type       | Default | Notes                    |
| -------------------- | ---------- | ------- | ------------------------ |
| `excludeTables.pull` | `string[]` | `[]`    | Don’t pull these tables. |
| `excludeTables.push` | `string[]` | `[]`    | Don’t push these tables. |

#### Conflict policy & field enforcement

| Option                 | Type                  | Default          | Notes                                                               |
| ---------------------- | --------------------- | ---------------- | ------------------------------------------------------------------- |
| `syncPolicy`           | `SupastashSyncPolicy` | `DEFAULT_POLICY` | See **Conflict Policy** below.                                      |
| `fieldEnforcement`     | `FieldEnforcement`    | `DEFAULT_FIELDS` | See **Field Enforcement** below.                                    |
| `deleteConflictedRows` | `boolean`             | `false`          | When `true`, non‑retryable conflicts will **delete** the local row. |

---

## Behavior & Precedence (how merges work)

`configureSupastash` builds the final config like this:

- `syncEngine`: **shallow-merged**. Provided keys override defaults.
- `excludeTables`: **per-key fallback**. If you pass only `pull`, existing `push` is preserved (and vice‑versa).
- `pollingInterval`: **per-key fallback** (same pattern as `excludeTables`).
- `syncPolicy`: **base** = `DEFAULT_POLICY` → then old `_config.syncPolicy` → then **your** `config.syncPolicy`. For the two _sets_ inside policy:
  - `nonRetryableCodes`: **replaced** by your provided set if given (no union).
  - `retryableCodes`: **replaced** by your provided set if given (no union).
- `fieldEnforcement`: base `DEFAULT_FIELDS` → old → your overrides (shallow merge).

> Practical upshot: if you want to **add** codes, you must supply a full set including the defaults you still want.

---

## Conflict Policy (DEFAULT_POLICY)

```ts
nonRetryableCodes: new Set(["23505","23502","23514","23P01"]),
retryableCodes:   new Set(["40001","40P01","55P03"]),
fkCode:           "23503",
onNonRetryable:   "accept-server",
maxTransientMs:   20 * 60 * 1000,
maxFkBlockMs:     24 * 60 * 60 * 1000,
backoffDelaysMs:  [10_000, 30_000, 120_000, 300_000, 600_000],
maxBatchAttempts: 5,
```

**Interpretation**

- `23505` (unique), `23502` (not null), `23514` (check), `23P01` (exclusion) → **NON_RETRYABLE**.
- `23503` (FK) → **FK_BLOCK** (held up to `maxFkBlockMs`).
- `40001`, `40P01`, `55P03` → **RETRYABLE** (backoff per `backoffDelaysMs`, within `maxTransientMs`).
- `onNonRetryable: "accept-server"` → default server‑wins resolution.

**Row deletion switch**

- If you want local rows actually **deleted** on non‑retryable conflicts, either:
  - set `syncPolicy.onNonRetryable = "delete-local"`, or
  - set top‑level `deleteConflictedRows = true` (your handler respects this).

**Recommended extra codes for prod**

```ts
nonRetryableCodes: new Set([
  "23505",
  "23502",
  "23514",
  "23P01", // defaults
  "22001", // string_data_right_truncation (name length caps)
  "22P02", // invalid_text_representation (bad UUID/number)
]);
```

---

## Field Enforcement (DEFAULT_FIELDS)

```ts
requireCreatedAt: true,
requireUpdatedAt: true,
createdAtField:   "created_at",
updatedAtField:   "updated_at",
autoFillMissing:  true,
autoFillDefaultISO: "1970-01-01T00:00:00Z",
```

- Enforces timestamp presence on all synced tables.
- When `autoFillMissing` is `true`, absent values are backfilled with `autoFillDefaultISO`.
- You can rename the columns (e.g., `created`/`modified`).

---

## SQLite Client Types

| Type           | Provide                 | Notes                                |
| -------------- | ----------------------- | ------------------------------------ |
| `"expo"`       | `{ openDatabaseAsync }` | Simple & stable for most apps.       |
| `"rn-nitro"`   | `{ open }`              | Best performance for large datasets. |
| `"rn-storage"` | `{ openDatabase }`      | Legacy; widely supported.            |

**Adapter contract**
The adapter you pass must ultimately satisfy `SupastashSQLiteAdapter.openDatabaseAsync(name, sqliteClient)` and return a `SupastashSQLiteDatabase` implementing `runAsync`, `getAllAsync`, `getFirstAsync`, and `execAsync`.

---

## Recipes

### Enforce unique name (≤20 chars) per shop; barcodes unique per shop

```ts
configureSupastash({
  syncPolicy: {
    nonRetryableCodes: new Set(["23505", "23502", "23514", "23P01", "22001"]),
    onNonRetryable: "accept-server",
  },
});
```

### Delete conflicted rows automatically

```ts
configureSupastash({
  deleteConflictedRows: true,
  syncPolicy: {
    onNonRetryable: "delete-local",
  },
});
```

### Override polling & exclude tables

```ts
configureSupastash({
  pollingInterval: { pull: 60_000, push: 15_000 },
  excludeTables: { pull: ["audit_logs"], push: ["snapshots"] },
});
```

### Use Nitro SQLite

```ts
import { open } from "react-native-nitro-sqlite";
configureSupastash({ sqliteClientType: "rn-nitro", sqliteClient: { open } });
```

---

## Troubleshooting & FAQs

**Q: Will rows be deleted locally on conflicts?**  
A: Only if you set `deleteConflictedRows: true` or `syncPolicy.onNonRetryable = 'delete-local'`. Otherwise the handler accepts the server row and stops retrying.

**Q: Do my custom error-code sets merge with defaults?**  
A: No. If you supply `nonRetryableCodes`/`retryableCodes`, they **replace** the sets. Include defaults plus your additions.

**Q: Is pull enabled by default?**  
A: In the current code, yes (`syncEngine.pull = true`). If you want extra safety, set it to `false` and rely on [useSupastashFilters.ts](./useSupastashFilters.md) for filtered pulls or enable only after RLS is tight.

**Q: Can I push via a custom RPC?**  
Yes — you can push via a custom RPC.
A: Set the pushRPCPath option in your Supastash config to the name of your RPC function. Supastash will then call this instead of the default .upsert() during push syncs, allowing you to batch inserts/updates and handle RLS safely.
📘 See detailed setup here: pushRPCPath ([Custom Batch Sync RPC](./sync-calls.md#-pushrpcpath-custom-batch-sync-rpc)).

B: Register a custom push function for a specific table. Push must return true/false.
📘 See detailed setup [here](./sync-calls.md).

---

## Breaking/Behavior Notes

- Policy sets are **replacing**, not unioning.
- `excludeTables`/`pollingInterval` keys use **per‑key fallback**; you can set just one without losing the other.
- `fieldEnforcement` defaults mandate timestamps; disable or rename if your schema differs.

---

## Reference Types (abridged)

```ts
export interface SupastashSyncPolicy {
  nonRetryableCodes?: Set<string>;
  retryableCodes?: Set<string>;
  fkCode?: string; // default '23503'
  onNonRetryable?: "accept-server" | "delete-local";
  maxTransientMs?: number; // default 20m
  maxFkBlockMs?: number; // default 24h
  backoffDelaysMs?: number[]; // default [10s,30s,120s,300s,600s]
  maxBatchAttempts?: number; // default 5
  ensureParents?: (table: string, row: any) => Promise<"ok" | "blocked">;
  onRowAcceptedServer?: (table: string, id: string) => void;
  onRowDroppedLocal?: (table: string, id: string) => void;
}

export interface FieldEnforcement {
  requireCreatedAt?: boolean; // default true
  requireUpdatedAt?: boolean; // default true
  createdAtField?: string; // default 'created_at'
  updatedAtField?: string; // default 'updated_at'
  autoFillMissing?: boolean; // default true
  autoFillDefaultISO?: string; // default '1970-01-01T00:00:00Z'
}
```

---

## Final Advice

- Keep pull **on** only with solid RLS and/or filtered pulls.
- Add `22001` and `22P02` to `nonRetryableCodes` for tighter UX.
- Prefer **server‑wins** for names; prompt users for barcode conflicts.
- If you truly need auto‑cleanups, enable `deleteConflictedRows` and instrument `onRowDroppedLocal` for visibility.
