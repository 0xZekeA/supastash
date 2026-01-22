# Runtime Modes

Supastash operates in one of two mutually exclusive runtime modes: **Live Mode** and **Ghost Mode**. Understanding these modes is critical for building reliable applications with Supastash.

## Table of Contents

- [Overview](#overview)
- [Live Mode](#live-mode)
- [Ghost Mode](#ghost-mode)
- [When to Use Ghost Mode](#when-to-use-ghost-mode)
- [Mode Switching](#mode-switching)
- [Rules and Guarantees](#rules-and-guarantees)

---

## Overview

Runtime modes define how Supastash interacts with core system components:

- **Local databases** – Isolated database channels per runtime mode
- **Remote sync** – Background synchronization with the Supabase backend
- **Realtime subscriptions** – Live server driven data updates
- **Background jobs** – Retry queues and deferred sync operations
- **Network access** – All outbound communication to remote services

> **Key Principle**  
> Supastash operates in exactly **one** runtime mode at any given time.  
> Switching modes requires a full reinitialization and is intentionally destructive to prevent state leakage and data corruption.

---

## Live Mode

**Live Mode** is the default runtime mode intended for production usage.

### Live Mode Behavior

When running in Live Mode, Supastash:

- Uses the **primary local database channel**
- Executes **background synchronization** with the Supabase backend
- Maintains **realtime subscriptions** when enabled
- Communicates freely with the **remote Supabase services**
- **Queues and retries** failed sync operations automatically

### Guarantees

Live Mode provides the following guarantees:

| Guarantee                | Description                                       |
| ------------------------ | ------------------------------------------------- |
| **Sync durability**      | Sync operations are never discarded               |
| **Automatic recovery**   | Failed sync jobs are queued in sqlite and retried |
| **Network availability** | Remote communication is enabled and expected      |

### When to Use

Use Live Mode for:

- All real user interactions
- Data that must persist and synchronize
- Production workflows
- Any operation that requires server communication

---

## Ghost Mode

**Ghost Mode** is a fully isolated, offline-safe environment.

### What Ghost Mode Does

In Ghost Mode, Supastash **guarantees**:

- 🚫 **Zero network activity** – No server communication of any kind
- 🚫 **No background sync loops** – Sync engine is completely disabled
- 🚫 **No realtime subscriptions** – No live data updates
- 🚫 **No remote polling** – No periodic checks to the server
- 🚫 **No server access** – Complete network isolation

### Database Isolation

Ghost Mode opens a **fully isolated local database channel**.

> **Important**  
> This database is **not** a clone of the Live Mode database.  
> The Ghost database starts empty and remains uninitialized until you explicitly create schema, tables, or seed data.

Ghost Mode does **not** automatically provide:

- ❌ Table schemas from Live Mode
- ❌ Triggers from Live Mode
- ❌ Indices from Live Mode
- ❌ Seed data from Live Mode
- ❌ Migrations from Live Mode

If you need schema, triggers, or seed data in Ghost Mode, you must **explicitly create them yourself**.

### Data Characteristics

Any data written in Ghost Mode:

- Never syncs to the server
- Never affects live user data
- Remains fully isolated from Live Mode
- Should be treated as **disposable**

---

## When to Use Ghost Mode

Ghost Mode is ideal for scenarios that require safe, isolated environments:

### Perfect Use Cases

```markdown
✓ In-app tutorials and walkthroughs
✓ Guided onboarding flows
✓ Feature demos and previews
✓ Testing critical flows safely
✓ Staging-like experiences in production apps
✓ Offline-first prototyping
```

---

### Example Scenario

A common use case for Ghost Mode is onboarding or tutorial flows where users interact with sample data.

```ts
// Switch to Ghost Mode for tutorial execution
await reinitializeSupastash("ghost");

// Explicitly initialize tutorial-only schema and data
await createGhostTables();
await seedTutorialData();

// User interacts with tutorial data safely
// No network access
// No remote sync
// No risk of affecting live data

// Exit tutorial and return to Live Mode
await reinitializeSupastash("live");
```

---

## Mode Switching

Switching modes requires **full reinitialization** through the dedicated function:

```ts
await reinitializeSupastash(mode: 'live' | 'ghost')
```

### What Happens During a Switch

The reinitialization process follows these steps in order:

1. **Stop active sync loops**  
   All background synchronization processes are halted to prevent in-flight operations during the transition.

2. **Unsubscribe from realtime channels**  
   All realtime subscriptions are explicitly terminated to guarantee no live connections remain active.

3. **Update runtime configuration**  
   The Supastash runtime mode is updated in configuration. Direct mutation outside this process is unsupported.

4. **Close the active database connection**  
   The current local database connection is safely closed to prevent cross-mode access.

5. **Open a mode-specific database connection**  
   A new local database channel is initialized based on the resolved runtime mode.

6. **Restart services when applicable**  
   Background sync and realtime services are restarted only when entering Live Mode.

This process is **deterministic and safe**.

---

## Rules and Guarantees

### Invariants

These rules **must always** be followed:

| Rule                                                                    | Consequence of Violation            |
| ----------------------------------------------------------------------- | ----------------------------------- |
| Runtime mode must **never** be mutated directly                         | Undefined behavior, data corruption |
| `reinitializeSupastash()` is the **only** supported way to change modes | No guarantees outside this function |

### Guarantees You Can Rely On

When you follow the rules above, Supastash guarantees:

- **Mode isolation**: Ghost and Live databases never interfere with each other
- **Sync preservation**: Live sync operations survive mode switches
- **Network safety**: Ghost Mode will never make network requests
- **Deterministic switching**: Mode changes are predictable and repeatable
- **No data loss**: Pending operations are never discarded

---

## Summary

| Aspect               | Live Mode                        | Ghost Mode                                |
| -------------------- | -------------------------------- | ----------------------------------------- |
| **Purpose**          | Real data, real users, real sync | Testing, tutorials, sandboxed experiences |
| **Database**         | Live channel                     | Isolated ghost channel                    |
| **Sync**             | ✅ Active                        | 🚫 Disabled                               |
| **Realtime**         | ✅ Active                        | 🚫 Disabled                               |
| **Data persistence** | ✅ Synced to server              | ❌ Local only, disposable                 |
| **Schema**           | ✅ Auto-managed                  | ❌ Manual setup required                  |

---

### Key Takeaways

> **Live Mode** is for real data, real users, and real sync.

> **Ghost Mode** is a sandboxed, offline-safe environment for testing, tutorials, and controlled experiences.

> **Mode switching** is explicit, destructive, and safe by design.

This strict separation is **intentional and required** for Supastash to remain reliable at scale.

---

```

```
