/**
 * Realtime Order Event Bus & Cross-Tab/Cross-Device Synchronization
 * Dispatches and listens to order state changes across components, tabs, and windows.
 */

export type OrderEventType =
  | "created"
  | "status_changed"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "deleted"
  | "refreshed";

export interface OrderEventDetail {
  type: OrderEventType;
  orderId?: string;
  orderNumber?: string;
  partnerId?: string;
  status?: string;
  timestamp: number;
}

const EVENT_NAME = "subhone_order_event";
const CHANNEL_NAME = "subhone_orders_channel";
const STORAGE_KEY = "subhone_last_order_pulse";

// BroadcastChannel for instant cross-tab sync within same browser
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

/**
 * Broadcast an order event to the current window and all other browser tabs
 */
export function notifyOrderEvent(
  type: OrderEventType,
  opts?: { orderId?: string; orderNumber?: string; partnerId?: string; status?: string }
) {
  if (typeof window === "undefined") return;

  const detail: OrderEventDetail = {
    type,
    orderId: opts?.orderId,
    orderNumber: opts?.orderNumber,
    partnerId: opts?.partnerId,
    status: opts?.status,
    timestamp: Date.now(),
  };

  // 1. Dispatch DOM CustomEvent in current window
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  } catch {}

  // 2. Broadcast to other tabs via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(detail);
    } catch {}
  }

  // 3. Fallback to localStorage pulse for cross-tab sync
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
  } catch {}
}

/**
 * Subscribe to all order events (in-window + cross-tab)
 */
export function subscribeToOrderEvents(callback: (detail: OrderEventDetail) => void): () => void {
  if (typeof window === "undefined") return () => {};

  // DOM listener
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<OrderEventDetail>;
    if (custom?.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(EVENT_NAME, handleCustomEvent);

  // BroadcastChannel listener
  const handleBroadcast = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleBroadcast);
  }

  // Storage listener fallback for older browsers or cross-origin tabs
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as OrderEventDetail;
        callback(detail);
      } catch {}
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleBroadcast);
    }
    window.removeEventListener("storage", handleStorage);
  };
}
