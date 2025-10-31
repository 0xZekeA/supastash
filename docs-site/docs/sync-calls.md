## ⚙️ Registering Custom Sync Calls (`syncCalls`)

Supastash lets you override or extend how specific tables **push** or **pull** data during synchronization — without modifying the core sync engine.

This is ideal when:

- You want to run a **custom RPC** instead of the standard `upsert()` logic.
- You want to perform a **custom pull** (e.g., fetching messages and marking them as delivered).
- You want **per-table sync behavior** (e.g., special logic for `sales` or `messages`).

> ⚠️ **Note:** Using custom sync calls will **bypass Supastash’s internal consistency and conflict handling**. This may compromise how Supastash manages synced data. Only use this feature if you fully understand your sync logic and its implications.

---

You can skip directly to the detailed RPC setup section below:

➡️ [Go to `pushRPCPath` (Custom Batch Sync RPC)](#-pushrpcpath-custom-batch-sync-rpc)

---

### 🧩 API

#### `registerSyncCall(table: string, entry: SyncEntry, options?: { allowOverride?: boolean })`

Registers a custom sync handler for a given table.

**Parameters:**

- `table` – The name of the table to attach the sync logic to.
- `entry` – The sync configuration object:

  ```ts
  type PushFn = (payload: any) => Promise<boolean>;
  type PullFn = (payload: any) => Promise<void>;

  type SyncEntry = {
    push?: PushFn; // Must return true if successful, false otherwise
    pull?: PullFn; // Handles remote → local updates or side effects
  };
  ```

- `allowOverride` – Whether to replace an existing registration (default: `false`).

---

#### `unregisterSyncCall(table: string)`

Removes a sync call registration for the specified table.

#### `getSyncCall(table: string)`

Retrieves the sync entry registered for the specified table.

#### `getAllSyncTables()`

Returns a list of all registered table names.

#### `clearSyncCalls()`

Clears all custom sync call registrations.

---

### 🚀 Example 1: Using a Custom RPC for Push

```ts
import { registerSyncCall } from "supastash/core/sync/registerSyncCall";
import { supabase } from "@/lib/supabase";

registerSyncCall("sales", {
  async push(rows) {
    const { error } = await supabase.rpc("batch_sync", {
      target_table: "sales",
      payload: rows,
      columns: Object.keys(rows[0] ?? {}),
    });

    if (error) {
      console.error("[Supastash] RPC push failed:", error);
      // Your retry logic
      // ...
      if (failed) return false; // failed, will retry later
    }

    return true; // success, mark rows as synced
  },
});
```

---

### 💬 Example 2: Pull + Mark Messages as Delivered

```ts
registerSyncCall("messages", {
  async pull(payload) {
    // Your logic
    // ..
    // Add payload to local db
    const { data, error } = await supastash
      .from("messages")
      .upsert(payload)
      .syncMode("localOnly")
      .run();

    if (error) throw error;

    // Example: mark received messages as delivered
    const deliveredIds = data.map((m) => m.id);
    await supabase.rpc("mark_messages_delivered", { ids: deliveredIds });

    console.log(`Pulled ${data.length} new messages`);
  },
});
```

---

### 🧠 Notes

- `push()` must **always return a boolean**: `true` for success, `false` for failure.
- You can combine both `push` and `pull` for a single table.
- If `allowOverride` is `false`, calling `registerSyncCall()` again for the same table will be ignored.
- Custom handlers integrate seamlessly with the existing Supastash scheduler.
- ⚠️ **Warning:** Custom sync handlers **bypass Supastash’s conflict resolution and validation layers**. You’re responsible for ensuring integrity, timestamps, and conflict safety in your custom implementation.

---

## 🔧 `pushRPCPath` (Custom Batch Sync RPC)

The `pushRPCPath` option in Supastash lets you replace the default `.upsert()`-based push behavior with a **single RPC call** per batch. This is ideal for large datasets, or when your **RLS policies** treat inserts and updates differently.

### Why Use a Custom RPC?

By default, Supastash syncs unsynced rows using `upsert()`. While convenient, this has a limitation:

- Supabase’s `upsert()` performs an **INSERT first**, even when the row already exists.
- If your RLS policies allow only `UPDATE` (and not `INSERT`), the call will fail entirely — and vice versa.

A custom RPC solves this by separating updates and inserts server-side, allowing your RLS to stay precise and efficient.

This also offers:

- **Performance gains**: one batch RPC per chunk instead of hundreds of `.upsert()` calls.
- **Custom conflict handling**: define how your RPC treats stale or unauthorized rows.
- **Egress reduction**: freshness checks and filtering are done inside Postgres.

> ⚠️ **Important:** Your RPC must handle `updated_at` freshness verification (only update when the incoming record is newer) and must return a structured result so Supastash can reconcile local sync states.

---

### Example: Configuring in Supastash

Once you’ve created your RPC (see next section for reference), add it to your Supastash configuration:

```ts
import { configureSupastash } from "supastash";
import { supabase } from "@/lib/supabase";

configureSupastash({
  dbName: "supastash_db",
  supabaseClient: supabase,
  // ... other options

  // 👇 Add your RPC name here
  pushRPCPath: "supastash_batch_sync",
});
```

> Supastash will now call your RPC automatically for all push operations, passing:
>
> ```ts
> await supabase.rpc("supastash_batch_sync", {
>   target_table: table,
>   payload: rows,
>   columns: Object.keys(rows[0] ?? {}),
> });
> ```

---

### Reference RPC: `supastash_batch_sync`

A generic, table-agnostic RPC. It stages JSON into the table’s row type (no manual casts), updates only when newer, inserts when missing, and returns per-row results including `record_exists`.

```sql

drop function supastash_batch_sync;
create or replace function public.supastash_batch_sync(
  target_table text,
  payload jsonb,
  columns text[]
)
returns table (
  id uuid,
  action text,
  reason text,
  record_exists boolean
)
language plpgsql
security invoker
as $$
declare
  collist text;
  update_assign text;
  insert_cols text;
  insert_vals text;
  dyn_sql text;
  qual text;
begin
  -- 1 Prepare column lists
  collist := array_to_string(columns, ', ');
  update_assign := array_to_string(
    array(
      select format('%I = i.%I', c, c)
      from unnest(columns) as c
      where c not in ('id')
    ), ', '
  );
  insert_cols := collist;
  insert_vals := array_to_string(
    array(
      select format('i.%I', c)
      from unnest(columns) as c
    ), ', '
  );

  -- 2 Stage incoming data
  -- build fully qualified table type
  qual := format('public.%I', target_table);
  EXECUTE format(
    'create temp table _incoming on commit drop as
    select * from jsonb_populate_recordset(NULL::%s, $1)',
    qual
  ) USING payload;



  -- 3 Results collector
  create temp table _results (
    id uuid,
    action text,
    reason text,
    record_exists boolean
  ) on commit drop;

  -- 4 Update existing newer rows
  EXECUTE format(
    'with upd as (
       update %I t
          set %s
         from _incoming i
        where t.id = i.id
          and i.updated_at > t.updated_at
        returning t.id
      )
    insert into _results
    select id, ''updated'', null, true from upd;',
    target_table,
    array_to_string(
      ARRAY(
        SELECT CASE WHEN c = 'id' THEN NULL ELSE format('%I = i.%I', c, c) END
        FROM unnest(columns) AS c
        WHERE c <> 'id'
      ),
      ', '
    )
  );

  -- 5 Insert new rows if not present
  EXECUTE format(
    'with ins as (
      insert into %I (%s)
      select %s from _incoming i
      where not exists (select 1 from %I t where t.id = i.id)
      on conflict (id) do nothing
      returning id
    )
    insert into _results
    select id, ''inserted'', null, false from ins;',
    target_table,
    array_to_string(columns, ', '),
    array_to_string(ARRAY(SELECT format('i.%I', c) FROM unnest(columns) AS c), ', '),
    target_table
  );

  -- 6 Mark stale rows (remote newer)
  dyn_sql := format(
    'insert into _results
       select i.id::uuid, ''skipped'', ''stale_remote'', true
       from _incoming i
       join %I t on t.id = i.id::uuid
       where i.updated_at::timestamptz <= t.updated_at
       and not exists (
    select 1 from _results r where r.id = i.id::uuid
  );',
    target_table
  );
  execute dyn_sql;

  -- 7 Catch any remaining missing/conflicted
  dyn_sql := format(
    'insert into _results
      select i.id::uuid, ''skipped'', ''conflict_or_unauthorized'',
      (t.id is not null) as exists
      from _incoming i
      left join %I t on t.id = i.id::uuid
     where not exists (
    select 1 from _results r where r.id = i.id::uuid
  );',
  target_table
  );
  execute dyn_sql;

  -- 8 Return unified results
  return query select * from _results;
end;
$$;

```

### Expected Return Shape

Your RPC must return an array of objects like this:

```ts
{
  id: string; // UUID of the row
  action: "updated" | "inserted" | "skipped";
  reason: "stale_remote", "conflict_or_unauthorized" | null; // if skipped, specify a reason, 'stale_remote' when remote row is newer
  record_exists: boolean; // Whether the row already exists remotely
}
```

Supastash uses this data to decide whether to retry, skip, or reinsert specific rows during sync.

---

### 🧠 Summary

- ✅ **Use \*\***pushRPCPath\*\* when RLS policies differ for `INSERT` vs `UPDATE`.
- 🧩 **RPC executes server-side**, reducing client-side logic and network usage.
- ⚠️ **Always include freshness checks** (`local.updated_at > remote.updated_at`).
- 🧱 **Leave room for conflict reasons** (`stale_remote`, `conflict_or_unauthorized`, etc.) for better visibility.
