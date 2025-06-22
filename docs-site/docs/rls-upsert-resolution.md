# 🔧 Avoiding RLS Errors on Upsert: Using a Custom RPC

### ❗ The Problem

Supastash uses `supabase.from(table).upsert()` under the hood to push bulk data to Supabase during sync.
This works well in most cases—but when RLS (Row-Level Security) is enabled, Supabase may block inserts even if the intent was just to update a row.

You might see errors like:

```
new row violates row-level security policy for table "orders"
```

This usually means:

- You have RLS enabled and insert is restricted.
- You're syncing with an existing row that Supabase doesn’t recognize yet (e.g., due to caching, delay, or deletion).

---

### ✅ The Solution

Supastash provides an optional **custom RPC function** that performs safe upserts server-side using PL/pgSQL. It:

- Checks if a row exists by `id`.
- Updates if it exists.
- Inserts only if it doesn't.
- Handles RLS violations gracefully and skips failed rows.
- Returns clear feedback (`success_ids`, `failed`).

This bypasses the default Supabase client behavior and avoids unsafe insert attempts that trigger RLS errors.

---

### 🔨 How to Enable

First, **add the RPC function** to your Supabase database:

```sql


CREATE OR REPLACE FUNCTION supastash_bulk_upsert(
  p_table_name       TEXT,
  rows               JSONB,
  p_id_field         TEXT DEFAULT 'id'
) RETURNS JSONB AS $$
DECLARE
  row           JSONB;
  row_exists    BOOLEAN;
  cols          TEXT[];
  insert_cols   TEXT;
  insert_vals   TEXT;
  update_stmt   TEXT;
  success_ids   TEXT[] := '{}';
  failed        JSONB   := '[]'::JSONB;
  id_data_type  TEXT;
  id_value_sql  TEXT;
BEGIN
  -- Fetch ID column's type to cast correctly later
  SELECT c.data_type INTO id_data_type
  FROM information_schema.columns AS c
  WHERE c.table_name = p_table_name
    AND c.column_name = p_id_field
    AND c.table_schema = 'public';

  FOR row IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    BEGIN
      -- Properly cast ID value for query
      id_value_sql := CASE
        WHEN id_data_type = 'uuid' THEN format('%L::uuid', row->>p_id_field)
        ELSE format('%L', row->>p_id_field)
      END;

      -- Check if available
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I WHERE %I = %s)',
        p_table_name,
        p_id_field,
        id_value_sql
      ) INTO row_exists;

      -- Extract column keys sorted
      SELECT array_agg(k ORDER BY k) INTO cols
      FROM jsonb_object_keys(row) AS t(k);

      IF row_exists THEN
        -- UPDATE
        update_stmt := format(
          'UPDATE %I SET %s WHERE %I = %s',
          p_table_name,
          array_to_string(
            ARRAY(
              SELECT format('%I = %L', col, row->>col)
              FROM unnest(cols) AS col
              WHERE col <> p_id_field
            ),
            ', '
          ),
          p_id_field,
          id_value_sql
        );
        EXECUTE update_stmt;
      ELSE
        -- Prepare INSERT
        insert_cols := array_to_string(
          ARRAY(
            SELECT quote_ident(col)
            FROM unnest(cols)
          ),
          ', '
        );

        insert_vals := array_to_string(
          ARRAY(
            SELECT CASE
              WHEN row ? col AND row->col IS NOT NULL THEN quote_literal(row->>col)
              ELSE 'NULL'
            END
            FROM unnest(cols) AS col
          ),
          ', '
        );

        EXECUTE format(
          'INSERT INTO %I (%s) VALUES (%s)',
          p_table_name,
          insert_cols,
          insert_vals
        );
      END IF;

      -- Record success
      success_ids := array_append(success_ids, row->>p_id_field);

    EXCEPTION WHEN OTHERS THEN
      IF SQLSTATE = '42501'
         AND position('violates row-level security' IN SQLERRM) > 0
      THEN
        failed := failed || jsonb_build_array(
          jsonb_build_object(
            'id',     row->>p_id_field,
            'error',  'RLS violation',
            'detail', SQLERRM
          )
        );
      ELSE
        failed := failed || jsonb_build_array(
          jsonb_build_object(
            'id',     row->>p_id_field,
            'error',  'Other error',
            'detail', SQLERRM
          )
        );
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success_ids', success_ids,
    'failed',      failed
  );
END;
$$ LANGUAGE plpgsql;


```

---

### ⚙️ Then, Enable It in Supastash

Add this option in your Supastash configuration:

```ts
configureSupastash({
  // ... other config
  useCustomRPCForUpserts: true,
});
```

> This will **automatically route all sync upsert operations** through `supastash_bulk_upsert`, ensuring safe row updates even with RLS insert policies in place.

---

### 📝 Recommendation

Use `useCustomRPCForUpserts: true` if:

- You **restrict `INSERT` in your RLS**.
