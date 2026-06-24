# Batch Pull Sync (RPC Mode)

By default, Supastash pulls each table individually, issuing one Supabase query per table.

Batch Pull Sync replaces those requests with a single Postgres RPC call that fetches multiple tables in one round trip. Pagination is handled server-side using a `remaining_tables` loop until all requested data has been synchronized.pagination server-side via the loop.

---

## When to use it

| Situation                                 | Recommendation                                                  |
| ----------------------------------------- | --------------------------------------------------------------- |
| Many tables syncing on startup            | ✅ Batch pull reduces waterfall queries                         |
| You need server-side filter enforcement   | ✅ Filters are compiled in Postgres — never raw SQL from client |
| You want a simple setup with a few tables | Per-table is fine, no change needed                             |
| Tables have no RLS configured             | ⛔ Do not use batch pull until RLS is enabled                   |

---

## ⚠️ Security requirements — read before deploying

> **Every table you expose through the RPC must have Row Level Security (RLS) enabled.**

The RPC function runs as the calling user (`security invoker`), so Postgres enforces your RLS policies on every row. If a table has RLS disabled, **any authenticated user can read its entire contents** through this function.

Checklist before deploying:

- [ ] RLS is enabled on every synced table
- [ ] Each table has a policy that scopes rows to the authenticated user (e.g. `user_id = auth.uid()` or equivalent)
- [ ] You have reviewed which tables are registered in Supastash

---

## Step 1 — Deploy the Postgres functions

Run both of these in the **Supabase SQL editor**. The first function is a recursive filter compiler; the second is the pull RPC itself.

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- supastash_compile_filter
--
--   Recursively compiles one filter node into a safe SQL fragment.
--   Node shapes:
--     { "col": "x", "op": "eq",  "val": "y" }  → simple predicate
--     { "or":  [ ...nodes ] }                   → (a OR b OR ...)
--     { "and": [ ...nodes ] }                   → (a AND b AND ...)
--
--   p_valid_cols is fetched once by the caller and threaded through every
--   recursive call so column validation never repeats a DB lookup.
--   All user strings go through quote_ident / quote_literal — never raw.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.supastash_compile_filter(
  p_table      text,
  p_valid_cols text[],
  p_node       jsonb
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_valid_ops constant text[] := array[
    'eq','neq','gt','gte','lt','lte','is_null','is_not_null','in'
  ];
  v_parts text[] := '{}';
  v_arr   jsonb;
  v_len   int;
  i       int;
  v_col   text;
  v_op    text;
  v_val   text;
begin

  if p_node ? 'or' then
    v_arr := p_node -> 'or';
    v_len := jsonb_array_length(v_arr);
    if v_len = 0 then
      raise exception 'supastash: empty "or" group on table "%"', p_table
        using errcode = '22023';
    end if;
    for i in 0 .. v_len - 1 loop
      v_parts := array_append(
        v_parts,
        public.supastash_compile_filter(p_table, p_valid_cols, v_arr -> i)
      );
    end loop;
    return '(' || array_to_string(v_parts, ' OR ') || ')';
  end if;

  if p_node ? 'and' then
    v_arr := p_node -> 'and';
    v_len := jsonb_array_length(v_arr);
    if v_len = 0 then
      raise exception 'supastash: empty "and" group on table "%"', p_table
        using errcode = '22023';
    end if;
    for i in 0 .. v_len - 1 loop
      v_parts := array_append(
        v_parts,
        public.supastash_compile_filter(p_table, p_valid_cols, v_arr -> i)
      );
    end loop;
    return '(' || array_to_string(v_parts, ' AND ') || ')';
  end if;

  v_col := p_node ->> 'col';
  v_op  := p_node ->> 'op';
  v_val := p_node ->> 'val';

  if v_col is null or not (v_col = any(p_valid_cols)) then
    raise exception
      'supastash: unknown column "%" on table "%"', v_col, p_table
      using errcode = '42703';
  end if;

  if v_op is null or not (v_op = any(v_valid_ops)) then
    raise exception
      'supastash: unsupported op "%" (allowed: eq,neq,gt,gte,lt,lte,is_null,is_not_null,in)',
      v_op
      using errcode = '22023';
  end if;

  if v_op not in ('is_null', 'is_not_null') and v_val is null then
    raise exception
      'supastash: op "%" on column "%" requires a val', v_op, v_col
      using errcode = '22023';
  end if;

  return case v_op
    when 'eq'          then format('%I = %L',           v_col, v_val)
    when 'neq'         then format('%I <> %L',          v_col, v_val)
    when 'gt'          then format('%I > %L',           v_col, v_val)
    when 'gte'         then format('%I >= %L',          v_col, v_val)
    when 'lt'          then format('%I < %L',           v_col, v_val)
    when 'lte'         then format('%I <= %L',          v_col, v_val)
    when 'is_null'     then format('%I IS NULL',        v_col)
    when 'is_not_null' then format('%I IS NOT NULL',    v_col)
    when 'in'          then
      format('%I = ANY(ARRAY[%s])', v_col,
        (select string_agg(quote_literal(trim(elem)), ',')
         from   unnest(string_to_array(v_val, ',')) as elem)
      )
  end;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- supastash_pull_sync
--
--   Fetches up to 1 000 rows spread across the requested tables.
--   Tables are validated against information_schema — no static allowlist.
--   Filters use { col, op, val } / { or } / { and } — never raw SQL.
--
--   Returns:
--     {
--       "tables":           { "<table>": [ ...rows ] },
--       "remaining_tables": [ ...tables that still have rows (budget hit) ]
--     }
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.supastash_pull_sync(
  p_tables  text[],
  p_filters jsonb default null,
  p_ts_col  text  default 'updated_at'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_global_limit   constant int    := 1000;
  v_result         jsonb           := jsonb_build_object('tables', '{}'::jsonb);
  v_remaining      int             := v_global_limit;
  v_returned       int             := 0;
  v_processed      text[]          := '{}';
  v_skipped        text[]          := '{}';
  v_remaining_tbls text[];
  v_unfinished     text            := null;
  v_table          text;
  v_sql            text;
  v_rows           jsonb;
  v_page_full      boolean;
  v_where          text;
  v_valid_cols     text[];
  v_filter_arr     jsonb;
  v_parts          text[]          := '{}';
  v_len            int;
  i                int;
begin

  if p_ts_col not in ('updated_at', 'arrived_at') then
    raise exception
      'supastash: p_ts_col must be "updated_at" or "arrived_at", got "%"', p_ts_col
      using errcode = '22023';
  end if;

  if p_tables is null or array_length(p_tables, 1) is null then
    return jsonb_build_object(
      'tables',           '{}'::jsonb,
      'remaining_tables', '[]'::jsonb
    );
  end if;

  foreach v_table in array p_tables loop
    exit when v_remaining <= 0;

    if not exists (
      select 1
      from   information_schema.tables
      where  table_schema = 'public'
        and  table_name   = v_table
    ) then
      v_skipped := array_append(v_skipped, v_table);
      continue;
    end if;

    v_filter_arr := case
      when p_filters is not null and p_filters ? v_table
        then p_filters -> v_table
      else null
    end;

    if v_filter_arr is not null
       and jsonb_typeof(v_filter_arr) = 'array'
       and jsonb_array_length(v_filter_arr) > 0
    then
      select array_agg(column_name::text)
      into   v_valid_cols
      from   information_schema.columns
      where  table_schema = 'public'
        and  table_name   = v_table;

      v_parts := '{}';
      v_len   := jsonb_array_length(v_filter_arr);
      for i in 0 .. v_len - 1 loop
        v_parts := array_append(
          v_parts,
          public.supastash_compile_filter(v_table, v_valid_cols, v_filter_arr -> i)
        );
      end loop;

      v_where := '(' || array_to_string(v_parts, ' AND ') || ')';
    else
      v_where := 'true';
    end if;

    v_sql := format($q$
      with page as (
        select *
        from   %1$I
        where  %2$s
        order  by %3$I asc, id asc
        limit  %4$s + 1
      ),
      sliced as (
        select * from page
        order  by %3$I asc, id asc
        limit  %4$s
      )
      select
        coalesce(jsonb_agg(to_jsonb(sliced)), '[]'::jsonb) as rows,
        exists (select 1 from page offset %4$s)            as page_full
      from sliced;
    $q$,
      v_table,    -- %1$I  table name
      v_where,    -- %2$s  compiled WHERE clause
      p_ts_col,   -- %3$I  timestamp column (arrived_at or updated_at)
      v_remaining -- %4$s  row budget
    );

    execute v_sql into v_rows, v_page_full;

    v_result    := jsonb_set(v_result, array['tables', v_table], v_rows, true);
    v_processed := array_append(v_processed, v_table);
    v_returned  := v_returned + jsonb_array_length(v_rows);
    v_remaining := v_global_limit - v_returned;

    if v_page_full and v_remaining <= 0 then
      v_unfinished := v_table;
      exit;
    end if;
  end loop;

  select array_agg(t order by array_position(p_tables, t))
  into   v_remaining_tbls
  from   unnest(p_tables) as t
  where  t <> all(v_processed)
    and  t <> all(v_skipped);

  if v_unfinished is not null then
    v_remaining_tbls := array_prepend(
      v_unfinished, coalesce(v_remaining_tbls, '{}')
    );
  end if;

  v_result := v_result || jsonb_build_object(
    'remaining_tables', coalesce(to_jsonb(v_remaining_tbls), '[]'::jsonb)
  );

  return v_result;
end;
$$;
```

---

## Step 2 — Enable the config flag

```ts
configureSupastash({
  // ... your existing config
  useBatchPullSync: true,
});
```

That's the only change to your existing setup. `syncAllTables()`, `useSupastash`, and the polling engine all route through the batch path automatically when this flag is on.

---

## Step 3 — Set per-table filters

Your existing `useSupastashFilters` call is all you need. Supastash automatically converts those filters for the batch RPC path — you don't write them twice.

```ts
useSupastashFilters({
  inventory: [{ column: "shop_id", operator: "eq", value: shopId }],
  orders:    [
    { column: "shop_id", operator: "eq", value: shopId },
    { column: "deleted_at", operator: "is", value: null }, // → is_null in RPC
  ],
});
```

Both pull paths (per-table and batch RPC) pick up the same filters. No duplicate registration.

The non-hook equivalent is `updateFilters(filters)` — same behaviour.

### When you need the second argument

The only reason to pass `rpcFilters` as the second argument to `useSupastashFilters` is when you need `and` groups, which `SupastashFilter` doesn't support:

```ts
useSupastashFilters(
  {
    orders: [{ column: "shop_id", operator: "eq", value: shopId }],
  },
  // Extra RPC-only constructs — only needed for "and" groups
  {
    orders: [
      {
        and: [
          { col: "status",    op: "eq", val: "active" },
          { col: "region_id", op: "eq", val: regionId },
        ],
      },
    ],
  }
);
```

These extra nodes are merged with the auto-converted filters before the RPC call.

---

## Filter format

Filters are structured JSON — not raw SQL. The RPC compiles them safely inside Postgres.

### Simple filter

```ts
{ col: "shop_id", op: "eq", val: shopId }
```

### Supported operators

| Operator      | SQL equivalent      | `val` required            |
| ------------- | ------------------- | ------------------------- |
| `eq`          | `=`                 | ✅                        |
| `neq`         | `<>`                | ✅                        |
| `gt`          | `>`                 | ✅                        |
| `gte`         | `>=`                | ✅                        |
| `lt`          | `<`                 | ✅                        |
| `lte`         | `<=`                | ✅                        |
| `in`          | `= ANY(ARRAY[...])` | ✅ comma-separated string |
| `is_null`     | `IS NULL`           | ❌                        |
| `is_not_null` | `IS NOT NULL`       | ❌                        |

### OR group

```ts
{
  or: [
    { col: "is_active", op: "eq",       val: "true" },
    { col: "brand_id",  op: "is_not_null" },
  ],
}
```

### Nested OR / AND (e.g. cursor pagination)

```ts
{
  or: [
    { col: "arrived_at", op: "gt", val: "2026-06-01T00:00:00Z" },
    {
      and: [
        { col: "arrived_at", op: "eq", val: "2026-06-01T00:00:00Z" },
        { col: "id",         op: "gt", val: "<last-seen-uuid>" },
      ],
    },
  ],
}
```

> Supastash builds the cursor filter automatically from your saved sync state — you don't need to add it manually.

---

## Testing the RPC directly

You can verify the function works from the Supabase SQL editor before wiring it into your app:

```sql
SELECT public.supastash_pull_sync(
  ARRAY['bikers'],
  '{
    "bikers": [
      { "col": "city",        "op": "eq",           "val": "e9673fbe-490d-4158-b578-cee6c9a4da0a" },
      { "col": "deleted_at",  "op": "is_null" },
      {
        "or": [
          { "col": "is_active", "op": "eq",          "val": "true" },
          { "col": "bike_id",   "op": "is_not_null" }
        ]
      }
    ]
  }'::jsonb,
  'arrived_at'   -- or 'updated_at' for client-side replication
);
```

---

## How pagination works

The RPC has a hard budget of **1 000 rows per call** spread across all tables. When the budget is hit before all tables are exhausted, the response includes `remaining_tables`.

Supastash handles this automatically — it loops until `remaining_tables` is empty, updating the sync cursor after each round so the next call picks up exactly where the last one left off.

```
Round 1 → fetches inventory (1 000 rows), budget hit
          remaining_tables: ["inventory"]

Round 2 → fetches inventory (600 rows, done)
          remaining_tables: []
```

You never need to manage this loop manually.

---

## What changes vs. the default pull

|                        | Default (per-table)                     | Batch RPC                                              |
| ---------------------- | --------------------------------------- | ------------------------------------------------------ |
| Network calls per sync | 1 per table                             | 1 per round (all tables)                               |
| Filter registration    | `useSupastashFilters(filters)`          | Same — no change needed                                |
| Filter format          | `SupastashFilter[]`                     | Auto-converted; `rpcFilters` only for `and` groups     |
| Filter enforcement     | PostgREST client-side chain             | Postgres server-side (SQL injection safe)              |
| Tables with no RLS     | Safe (PostgREST enforces RLS)           | ⚠️ Unsafe — enable RLS first                           |

---

## ⚠️ Risk summary

> **Do not enable `useBatchPullSync` on tables that lack RLS.**
>
> The function uses `security invoker`, meaning it runs as the authenticated user and respects RLS. However, if a table has RLS disabled, every authenticated user in your project can read its full contents by calling this function — even tables they were never meant to access.
>
> Always verify with `select tablename, rowsecurity from pg_tables where schemaname = 'public';` that every synced table has `rowsecurity = true` before going to production.

---

## Bonus — Batch schema fetch

By default Supastash calls `get_table_schema` once per table, on demand, the first time that table is accessed. With many tables this creates a waterfall of schema fetches at startup.

**`useBatchSchemaFetch`** replaces that with a single `get_table_schemas` call that fetches column metadata for every table at once, warming the in-memory and SQLite caches before any sync work begins.

### Deploy the function

```sql
create or replace function public.get_table_schemas(
  p_tables text[]
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(t.table_name, t.columns),
    '{}'::jsonb
  )
  from (
    select
      table_name,
      jsonb_agg(
        jsonb_build_object(
          'column_name',    column_name,
          'data_type',      data_type,
          'is_nullable',    is_nullable,
          'column_default', column_default
        )
        order by ordinal_position
      ) as columns
    from   information_schema.columns
    where  table_schema = 'public'
      and  table_name   = any(p_tables)
    group  by table_name
  ) t;
$$;
```

### Enable it

```ts
configureSupastash({
  useBatchSchemaFetch: true,
  // can be combined with useBatchPullSync or used independently
});
```

### Test it in the SQL editor

```sql
SELECT public.get_table_schemas(
  ARRAY['inventory', 'customers', 'orders']
);
```

Returns:

```json
{
  "inventory": [
    { "column_name": "id",         "data_type": "uuid",                       "is_nullable": "NO",  "column_default": "gen_random_uuid()" },
    { "column_name": "name",       "data_type": "text",                       "is_nullable": "NO",  "column_default": null },
    { "column_name": "updated_at", "data_type": "timestamp with time zone",   "is_nullable": "NO",  "column_default": "now()" }
  ],
  "customers": [ ... ]
}
```

### What it replaces

|                           | Default                       | Batch schema fetch           |
| ------------------------- | ----------------------------- | ---------------------------- |
| RPC calls for 10 tables   | 10 (one per table, on demand) | 1 (all tables at sync start) |
| Cache warmed before sync  | ❌ lazily on first use        | ✅ before first table pull   |
| Works with per-table pull | ✅                            | ✅                           |
| Works with batch pull     | ✅                            | ✅                           |

> This function only reads `information_schema.columns` — it has no access to your data. It is safe to deploy without RLS considerations.
