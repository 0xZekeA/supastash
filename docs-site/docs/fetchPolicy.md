# Fetch Policies

## ⚡ How `cacheFirst()` Works

When you execute a query with this policy, Supastash follows a specific sequence:

1. **Check Local DB:** It searches your local SQLite storage for the requested data.
2. **Return if Found:** If the data exists locally, it is returned **immediately**. No network request is made.
3. **Fetch from Remote:** If the data is **not** found locally (e.g., a cache miss), it performs a network request to your remote database (Supabase).
4. **Update Local DB:** Once the remote data arrives, it is saved locally for future requests.
5. **Return Remote Data:** Finally, the data is returned to your application.

---

## 🛠️ Code Example

This is ideal for data that doesn't change every second, like user profiles or historical orders.

```typescript
const { data, error } = await supastash
  .from("orders")
  .select("*")
  .eq("status", "completed")
  .cacheFirst() // 👈 The magic happens here
  .run();

// If "completed orders" are already in SQLite,
// this returns in ~5ms instead of ~200ms+.
```

---

## 📊 Comparison: When to use Cache-First?

| Feature        | `cacheFirst()`                  | `networkOnly()`                 |
| -------------- | ------------------------------- | ------------------------------- |
| **Speed**      | 🚀 **Fastest** (Local Read)     | 🐢 **Slower** (Network Latency) |
| **Offline**    | ✅ Works offline if data exists | ❌ Fails without internet       |
| **Freshness**  | ⚠️ May be outdated              | ✨ Always up-to-date            |
| **Data Usage** | 📉 Saves bandwidth              | 📈 High bandwidth usage         |

---

## 💡 Best Use Cases

- **Static Metadata:** Categories, app configurations, or country lists.
- **User History:** Past orders or archived messages that rarely change.
- **Offline Support:** Ensuring the app remains functional when the user loses their connection.
- **Reducing Costs:** Minimizing API calls to your Supabase project to stay within free-tier limits or reduce egress.

---

### ⚠️ Important Note on "Stale" Data

Because `cacheFirst()` stops once it finds data locally, it will **not** check if that data has changed on the server. If you need the latest data while still showing local data instantly, consider using a **"Stale-While-Revalidate"** approach (often called `cacheAndNetwork` in other libraries).
