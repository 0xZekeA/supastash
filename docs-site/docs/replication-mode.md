# 🔁 Replication Mode

Supastash determines incremental synchronization using a **replication cursor**, a dedicated timestamp column used to decide which rows are new since the last successful sync.

Every sync cycle answers one core question:

> Which rows have arrived after this device’s last_sync_marker?

The column used as that marker depends on your selected `replicationMode`.

Choosing the correct replication mode directly impacts data consistency across multiple devices and long offline sessions.

---

# 🧭 Two Replication Modes

```ts
configureSupastash({
  replicationMode: "client-side", // or "server-side"
});
```

### 1️⃣ Client-Side Replication (Legacy)

**Uses:** `updated_at` as the sync cursor.

**How It Works**

1. Every device updates `updated_at` locally.
2. During sync, Supastash pulls rows where: `updated_at > last_synced_at`.

**Pros:** Simple. No extra server setup required.

#### ⚠️ The Problem (Important)

Because `updated_at` is generated on the device:

- Devices may be offline for a long time.
- A device may reconnect later and push old updates.

**Real Edge Case:**

1. **10:00 AM** — Device A updates a row while offline.  
   → `updated_at = 10:00`

2. **10:05 AM** — Device B updates the same table (offline).  
   → `updated_at = 10:05`

3. **10:10 AM** — Device B reconnects and pushes its update to the server.

4. **10:20 AM** — Device C syncs, pulls Device B’s update, and stores:  
   → `last_synced_at = 10:05` for that table.

5. Later — Device A reconnects and pushes its update (`updated_at = 10:00`).

#### What Happens?

Device C will **never receive Device A’s update**, because:

```
10:00 < last_synced_at (10:05)
```

From Device C’s perspective, the update appears older than its last sync checkpoint — so it is skipped.

This is the core weakness of client-side replication.

> **“Fixing It” Is Not Clean:** If you make the server update `updated_at` on write, it no longer represents "when the user made the change," breaking the meaning of the column. This is why we need a different column.

---

### 2️⃣ Server-Side Replication (Recommended)

**Uses:** `arrived_at` as the sync cursor.

**How It Works**

- Devices still send `updated_at`.
- But the server sets `arrived_at = now()` when it receives the row.
- Sync uses `arrived_at`, not `updated_at`.

Now the earlier problem disappears.

**Same Scenario, Server-Side:**

Now assume Supastash is using **server-side replication** with `arrived_at` as the sync cursor.

1. **10:00 AM** — Device A updates a row while offline.  
   → `updated_at = 10:00`

2. **10:05 AM** — Device B updates the same table while offline.  
   → `updated_at = 10:05`

3. **10:10 AM** — Device B reconnects and pushes its update.  
   → The server stores the row and sets `arrived_at = 10:10`.

4. **10:20 AM** — Device C syncs.  
   → It pulls Device B’s update and stores:  
   → `last_synced_at = 10:10` (based on `arrived_at`, not `updated_at`).

5. Later — Device A reconnects and pushes its update (`updated_at = 10:00`).  
   → The server sets `arrived_at = 11:00` (time of arrival).

### What Happens?

On the next sync, Device C **will pull Device A’s update**, because:

```
arrived_at (11:00) > last_synced_at (10:10)
```

Even though the change originally happened at 10:00 AM,  
it is synchronized based on **when it arrived at the server**.

That distinction prevents missed updates and guarantees correct ordering across devices.

---

## 🛡 Why Server-Side Is Better

The example above says it all. Server-side replication orders sync by when data **arrives at the server**, not when a device originally set `updated_at`.  
So even after long offline periods, updates are not skipped, ordering is based on arrival time, not device time.

---

## 🏗 What You Must Add (Server-Side Mode)

Each synced table must include:
`arrived_at timestamptz NOT NULL DEFAULT now()`

And the server must control it with a trigger.

### 🔧 Trigger Function (Server-Controlled Arrival)

```sql
CREATE OR REPLACE FUNCTION enforce_server_arrival_timestamp()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.arrived_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.updated_at > NEW.updated_at THEN
      RAISE EXCEPTION
        'Stale update rejected. Existing updated_at (%) is newer than incoming (%)',
        OLD.updated_at, NEW.updated_at;
    END IF;

    NEW.arrived_at := now();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

```

**Attach to each table:**

```sql
CREATE TRIGGER set_arrived_at
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION enforce_server_arrival_timestamp();

```

---

## 🔁 Apply to Multiple Tables

```sql
CREATE OR REPLACE FUNCTION apply_arrival_trigger_to_tables(table_names text[])
RETURNS void AS $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY table_names
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_arrived_at
       BEFORE INSERT OR UPDATE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION enforce_server_arrival_timestamp();',
      t
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

```

**Usage:**

```sql
SELECT apply_arrival_trigger_to_tables(
  ARRAY['orders', 'order_items']
);

```

---

## 📌 Final Comparison

| Mode            | Sync Cursor  | Safe After Long Offline? | Clock Safe? | Recommended        |
| --------------- | ------------ | ------------------------ | ----------- | ------------------ |
| **client-side** | `updated_at` | ❌ No                    | ❌ No       | Simple setups only |
| **server-side** | `arrived_at` | ✅ Yes                   | ✅ Yes      | ✅ **Production**  |

---

## 🔚 Summary

- **Client-side** works for simple apps.
- **Server-side** works for real distributed offline systems.

If you care about correctness across devices and long offline gaps, use **server-side replication**.
