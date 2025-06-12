// DEPRECATED: Use useRealtimeData instead
import { getSupastashConfig } from "../../core/config";
import log from "../logs";
import { supabaseClientErr } from "../supabaseClientErr";
class SupastashRealtimeManager {
    constructor() {
        // Realtime connection state
        this.connection = null;
        this.subscriptions = new Map(); // Active subscriptions
        this.isConnected = false; // True if connected to the shared channel
        this.connectionStatus = "disconnected";
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscribeDebounceTimer = null;
        this.disconnectDebounceTimer = null;
        this.statusListeners = new Set();
    }
    static getInstance() {
        if (!SupastashRealtimeManager.instance) {
            SupastashRealtimeManager.instance = new SupastashRealtimeManager();
        }
        return SupastashRealtimeManager.instance;
    }
    getSubscriptionKey(table, filterString) {
        return `${table}::${filterString ?? ""}`;
    }
    // Creates one shared realtime connection
    async createConnection() {
        const supabase = getSupastashConfig().supabaseClient;
        if (!supabase) {
            console.error("[Supastash] No supabase client found", supabaseClientErr);
            return null;
        }
        if (this.connection) {
            return this.connection;
        }
        this.connection = supabase.channel("supastash:shared-realtime");
        this.connectionStatus = "connecting";
        this.notifyStatusListeners("connecting");
        return this.connection;
    }
    // Subscribes to the shared realtime connection
    async subscribeConnection() {
        if (!this.connection || this.isConnected)
            return;
        return new Promise((resolve, reject) => {
            this.connection?.subscribe((status, err) => {
                if (err) {
                    this.connectionStatus = "error";
                    this.notifyStatusListeners("error");
                    reject(err);
                    return;
                }
                switch (status) {
                    case "SUBSCRIBED":
                        this.isConnected = true;
                        this.connectionStatus = "connected";
                        this.reconnectAttempts = 0;
                        this.notifyStatusListeners("connected");
                        log("[Supastash] ✅ Shared channel connected successfully");
                        resolve();
                        break;
                    case "CLOSED":
                    case "CHANNEL_ERROR":
                        this.handleConnectionError();
                        reject(new Error(`Connection failed with status: ${status}`));
                        break;
                    case "TIMED_OUT":
                        this.handleConnectionTimeout();
                        reject(new Error("Connection timed out"));
                        break;
                }
            });
        });
    }
    handleConnectionError() {
        this.cleanup();
        this.scheduleReconnect();
    }
    handleConnectionTimeout() {
        this.cleanup();
        this.scheduleReconnect();
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionStatus = "error";
            this.notifyStatusListeners("error");
            return;
        }
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;
        setTimeout(() => {
            if (this.subscriptions.size > 0) {
                this.reconnect();
            }
        }, delay);
    }
    async reconnect() {
        this.cleanup();
        try {
            await this.createConnection();
            await this.resubscribeAll();
            await this.subscribeConnection();
        }
        catch (error) {
            this.scheduleReconnect();
        }
    }
    async resubscribeAll() {
        if (!this.connection)
            return;
        for (const [key, subscription] of this.subscriptions) {
            if (subscription.isActive) {
                this.bindTableListener(subscription.table, subscription.filterString, key);
            }
        }
    }
    async bindTableListener(table, filterString, key) {
        if (!this.connection) {
            await this.createConnection();
        }
        const subscription = this.subscriptions.get(key);
        if (!subscription)
            return;
        subscription.isActive = true;
        this.subscriptions.set(key, subscription);
        this.connection?.on("postgres_changes", { event: "*", schema: "public", table, filter: filterString }, (payload) => {
            try {
                console.log("payload", payload, table);
                const subscription = this.subscriptions.get(key);
                if (!subscription)
                    return;
                const data = payload.new || payload.old;
                for (const handler of subscription.handlers.values()) {
                    handler(payload.eventType, data);
                }
            }
            catch (err) {
                log(`❌ Error in handler for ${key}: ${err}`);
            }
        });
    }
    cleanup() {
        if (this.connection) {
            this.connection.unsubscribe();
            this.connection = null;
        }
        this.isConnected = false;
        this.connectionStatus = "disconnected";
        if (this.subscribeDebounceTimer) {
            clearTimeout(this.subscribeDebounceTimer);
            this.subscribeDebounceTimer = null;
        }
    }
    notifyStatusListeners(status) {
        this.statusListeners.forEach((listener) => {
            try {
                listener(status);
            }
            catch (error) {
                log(`❌ Error in status listener: ${error}`);
            }
        });
    }
    debouncedSubscribe() {
        if (this.subscribeDebounceTimer)
            clearTimeout(this.subscribeDebounceTimer);
        this.subscribeDebounceTimer = setTimeout(async () => {
            try {
                if (!this.connection) {
                    await this.createConnection();
                }
                await this.resubscribeAll();
                if (!this.isConnected) {
                    await this.subscribeConnection();
                }
            }
            catch (err) {
                log(`❌ subscribe failed, retrying in 1s: ${err}`);
                setTimeout(() => this.debouncedSubscribe(), 1000);
            }
            finally {
                this.subscribeDebounceTimer = null;
            }
        }, 500);
    }
    debouncedDisconnect() {
        if (this.disconnectDebounceTimer) {
            clearTimeout(this.disconnectDebounceTimer);
        }
        this.disconnectDebounceTimer = setTimeout(() => {
            if (this.subscriptions.size === 0) {
                this.cleanup();
                this.notifyStatusListeners("disconnected");
            }
            this.disconnectDebounceTimer = null;
        }, 2000);
    }
    // Subscribes to a table
    subscribe(table, hookId, handler, filterString) {
        const key = this.getSubscriptionKey(table, filterString);
        if (this.disconnectDebounceTimer) {
            clearTimeout(this.disconnectDebounceTimer);
            this.disconnectDebounceTimer = null;
        }
        let subscription = this.subscriptions.get(key);
        if (!subscription) {
            subscription = {
                table,
                filterString,
                handlers: new Map(),
                isActive: false,
            };
            this.subscriptions.set(key, subscription);
        }
        subscription.handlers.set(hookId, handler);
        if (!subscription.isActive) {
            this.bindTableListener(table, filterString, key);
            this.debouncedSubscribe();
        }
    }
    unsubscribe(table, hookId, filterString) {
        const key = this.getSubscriptionKey(table, filterString);
        const subscription = this.subscriptions.get(key);
        if (!subscription)
            return;
        subscription.handlers.delete(hookId);
        if (subscription.handlers.size === 0) {
            subscription.isActive = false;
            this.subscriptions.delete(key);
            if (this.subscriptions.size === 0) {
                this.debouncedDisconnect();
            }
        }
    }
    getConnectionStatus() {
        return this.connectionStatus;
    }
    onStatusChange(listener) {
        this.statusListeners.add(listener);
        return () => {
            this.statusListeners.delete(listener);
        };
    }
    getActiveSubscriptions() {
        return this.subscriptions.size;
    }
    forceReconnect() {
        this.reconnectAttempts = 0;
        this.reconnect();
    }
}
// Supastash realtime manager singleton instance
SupastashRealtimeManager.instance = null;
export const RealtimeManager = SupastashRealtimeManager.getInstance();
export function subscribeToTable(table, filterString, queueHandler, hookId = `hook_${Date.now()}_${Math.random()}`) {
    RealtimeManager.subscribe(table, hookId, queueHandler, filterString);
}
export function unsubscribeFromTable(table, filterString, queueHandler, hookId) {
    RealtimeManager.unsubscribe(table, hookId, filterString);
}
