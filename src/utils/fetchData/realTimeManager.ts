// DEPRECATED: Use useRealtimeData instead

import { RealtimeChannel } from "@supabase/supabase-js";
import { getSupastashConfig } from "../../core/config";
import {
  EventHandler,
  HookId,
  SubscriptionKey,
  TableSubscription,
} from "../../types/realtimeData.types";
import log from "../logs";
import { supabaseClientErr } from "../supabaseClientErr";

class SupastashRealtimeManager {
  // Supastash realtime manager singleton instance
  private static instance: SupastashRealtimeManager | null = null;
  // Realtime connection state
  private connection: RealtimeChannel | null = null;
  private subscriptions: Map<SubscriptionKey, TableSubscription> = new Map(); // Active subscriptions
  private isConnected: boolean = false; // True if connected to the shared channel

  private connectionStatus:
    | "disconnected"
    | "connecting"
    | "connected"
    | "error" = "disconnected";
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private subscribeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private statusListeners: Set<(status: string) => void> = new Set();

  private constructor() {}

  static getInstance(): SupastashRealtimeManager {
    if (!SupastashRealtimeManager.instance) {
      SupastashRealtimeManager.instance = new SupastashRealtimeManager();
    }
    return SupastashRealtimeManager.instance;
  }

  private getSubscriptionKey(
    table: string,
    filterString?: string
  ): SubscriptionKey {
    return `${table}::${filterString ?? ""}`;
  }

  // Creates one shared realtime connection
  private async createConnection(): Promise<RealtimeChannel | null> {
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
  private async subscribeConnection(): Promise<void> {
    if (!this.connection || this.isConnected) return;

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
  private handleConnectionError(): void {
    this.cleanup();
    this.scheduleReconnect();
  }

  private handleConnectionTimeout(): void {
    this.cleanup();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
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

  private async reconnect(): Promise<void> {
    this.cleanup();

    try {
      await this.createConnection();
      await this.resubscribeAll();
      await this.subscribeConnection();
    } catch (error) {
      this.scheduleReconnect();
    }
  }

  private async resubscribeAll(): Promise<void> {
    if (!this.connection) return;

    for (const [key, subscription] of this.subscriptions) {
      if (subscription.isActive) {
        this.bindTableListener(
          subscription.table,
          subscription.filterString,
          key
        );
      }
    }
  }

  private async bindTableListener(
    table: string,
    filterString: string | undefined,
    key: SubscriptionKey
  ): Promise<void> {
    if (!this.connection) {
      await this.createConnection();
    }
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;
    subscription.isActive = true;
    this.subscriptions.set(key, subscription);

    this.connection?.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: filterString },
      (payload) => {
        try {
          const subscription = this.subscriptions.get(key);
          if (!subscription) return;

          const data = payload.new || payload.old;
          for (const handler of subscription.handlers.values()) {
            handler(payload.eventType, data);
          }
        } catch (err) {
          log(`❌ Error in handler for ${key}: ${err}`);
        }
      }
    );
  }

  private cleanup(): void {
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

  private notifyStatusListeners(status: string): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        log(`❌ Error in status listener: ${error}`);
      }
    });
  }

  private debouncedSubscribe(): void {
    if (this.subscribeDebounceTimer) clearTimeout(this.subscribeDebounceTimer);

    this.subscribeDebounceTimer = setTimeout(async () => {
      try {
        if (!this.connection) {
          await this.createConnection();
        }

        await this.resubscribeAll();

        if (!this.isConnected) {
          await this.subscribeConnection();
        }
      } catch (err) {
        log(`❌ subscribe failed, retrying in 1s: ${err}`);
        setTimeout(() => this.debouncedSubscribe(), 1000);
      } finally {
        this.subscribeDebounceTimer = null;
      }
    }, 500);
  }

  private debouncedDisconnect(): void {
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
  public subscribe(
    table: string,
    hookId: HookId,
    handler: EventHandler,
    filterString?: string
  ): void {
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

  public unsubscribe(
    table: string,
    hookId: HookId,
    filterString?: string
  ): void {
    const key = this.getSubscriptionKey(table, filterString);
    const subscription = this.subscriptions.get(key);

    if (!subscription) return;

    subscription.handlers.delete(hookId);

    if (subscription.handlers.size === 0) {
      subscription.isActive = false;
      this.subscriptions.delete(key);

      if (this.subscriptions.size === 0) {
        this.debouncedDisconnect();
      }
    }
  }

  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  public onStatusChange(listener: (status: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getActiveSubscriptions(): number {
    return this.subscriptions.size;
  }

  public forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.reconnect();
  }
}

export const RealtimeManager = SupastashRealtimeManager.getInstance();

export function subscribeToTable(
  table: string,
  filterString: string | undefined,
  queueHandler: (eventType: string, data: any) => void,
  hookId: string = `hook_${Date.now()}_${Math.random()}`
): void {
  RealtimeManager.subscribe(table, hookId, queueHandler, filterString);
}

export function unsubscribeFromTable(
  table: string,
  filterString: string | undefined,
  queueHandler: (eventType: string, data: any) => void,
  hookId: string
): void {
  RealtimeManager.unsubscribe(table, hookId, filterString);
}
