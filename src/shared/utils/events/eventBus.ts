import { EventEmitter } from "events";
import { getSupastashConfig } from "../../core/config";

/**
 * 📡 Supastash Event Bus
 *
 * A centralized event emitter for broadcasting and listening to app-level events.
 *
 * ✅ Used by Supastash for:
 * - Triggering local-first sync actions
 * - Broadcasting table-specific refresh events
 * - Coordinating updates across Zustand stores (e.g. sales, inventory, transfers)
 *
 * 🛠️ Integration with Zustand:
 * - Hydration hooks listen to specific event patterns (e.g. `supastash:refreshZustand:sales`)
 * - Each store defines a `hydrate*` method to refresh its data on demand
 *
 * @usage
 * - Emit: `supastashEventBus.emit("supastash:refreshZustand:sales")`
 * - Listen: `supastashEventBus.on("supastash:refreshZustand:sales", hydrateSales)`
 *
 * @config
 * - Max listeners are configurable via `configureSupastash({...listeners})` (default: 250)
 */
export const supastashEventBus = new EventEmitter();
supastashEventBus.setMaxListeners(getSupastashConfig()?.listeners || 250);
