import { supabase } from "./supabase";
import { DbAddress, getEffectiveUserId } from "./addresses";
import { CartItem } from "../contexts/CartContext";

export type OrderStatus =
  | "Processing"
  | "Dispatched"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: Partial<DbAddress>;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItem[];
  user_role?: "retailer" | "customer" | "admin";
  shop_name?: string | null;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

const LOCAL_ORDERS_KEY = "subhone_local_orders_v2";
const DELETED_ORDERS_KEY = "subhone_deleted_order_ids_v1";

export function getDeletedOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markOrderAsDeletedLocally(orderId: string, orderNumber?: string) {
  try {
    const list = getDeletedOrderIds();
    const toAdd = [orderId, orderNumber].filter(Boolean) as string[];
    const updated = Array.from(new Set([...list, ...toAdd]));
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not mark order deleted locally:", e);
  }
}

function getLocalOrders(): DbOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: DbOrder[] = raw ? JSON.parse(raw) : [];
    const deleted = getDeletedOrderIds();
    return list.filter((o) => !deleted.includes(o.id) && !deleted.includes(o.order_number));
  } catch {
    return [];
  }
}

function saveLocalOrder(order: DbOrder) {
  try {
    const list = getLocalOrders();
    const updated = [order, ...list.filter((o) => o.id !== order.id && o.order_number !== order.order_number)];
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save order locally:", e);
  }
}

/**
 * Place a new order with order items (100% resilient across Retailers & Customers)
 */
export async function placeOrder(params: {
  customerName: string;
  customerPhone: string;
  shippingAddress: Partial<DbAddress>;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  userId?: string;
  userRole?: "retailer" | "customer" | "admin";
  shopName?: string | null;
}): Promise<{ data: DbOrder | null; error: string | null }> {
  try {
    if (!params.items || params.items.length === 0) {
      return { data: null, error: "Your shopping cart is empty. Please add items to place an order." };
    }

    const userId = await getEffectiveUserId(params.userId);
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    let orderData: any = null;
    let orderId = `ord_${Date.now()}`;

    const effectiveShippingAddress = {
      ...(params.shippingAddress || {}),
      user_role: params.userRole || "customer",
      shop_name: params.shopName || null,
    };

    // 1. Insert order record into Supabase
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            order_number: orderNumber,
            user_id: userId,
            customer_name: params.customerName || "Customer",
            customer_phone: params.customerPhone || "+91 98765 00000",
            shipping_address: effectiveShippingAddress,
            total_amount: params.totalAmount,
            payment_method: params.paymentMethod || "UPI",
            payment_status: "Paid",
            status: "Processing",
          },
        ])
        .select()
        .single();

      if (data && !error) {
        orderData = data;
        orderId = data.id;
      } else if (error) {
        console.warn("Notice inserting order to Supabase:", error.message);
      }
    } catch (e) {
      console.warn("Supabase order insert error:", e);
    }

    // 2. Insert order items (no `id` — let Supabase auto-generate the UUID primary key)
    const orderItemsPayload = params.items.map((item) => ({
      order_id: orderId,
      product_id: item.productId || null,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      image_url: item.imageUrl || null,
    }));

    if (orderData) {
      try {
        await supabase.from("order_items").insert(
          orderItemsPayload.map((it) => ({
            order_id: it.order_id,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total_price: it.total_price,
            image_url: it.image_url,
          }))
        );
      } catch (e) {
        console.warn("Notice inserting order_items:", e);
      }

      // Decrement product stock in real-time
      for (const item of params.items) {
        try {
          if (item.productId && item.productId.includes("-")) {
            const { data: prod } = await supabase.from("products").select("stock").eq("id", item.productId).single();
            if (prod) {
              await supabase.from("products").update({ stock: Math.max(0, prod.stock - item.quantity) }).eq("id", item.productId);
            }
          } else {
            const { data: prod } = await supabase.from("products").select("id, stock").eq("name", item.name).maybeSingle();
            if (prod) {
              await supabase.from("products").update({ stock: Math.max(0, prod.stock - item.quantity) }).eq("id", prod.id);
            }
          }
        } catch {}
      }

      // Clear user's cart in Supabase
      try {
        await supabase.from("cart_items").delete().eq("user_id", userId);
      } catch {}
    }

    const fullOrder: DbOrder = {
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      customer_name: params.customerName || "Customer",
      customer_phone: params.customerPhone || "+91 98765 00000",
      shipping_address: effectiveShippingAddress,
      total_amount: params.totalAmount,
      payment_method: params.paymentMethod || "UPI",
      payment_status: "Paid",
      status: "Processing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_role: params.userRole || "customer",
      shop_name: params.shopName || null,
      order_items: orderItemsPayload,
    };

    // Save to local cache so user always sees their order immediately
    saveLocalOrder(fullOrder);

    return { data: fullOrder, error: null };
  } catch (err: any) {
    console.error("placeOrder fatal catch:", err);
    return { data: null, error: err?.message || "Failed to complete order. Please check connection." };
  }
}

/**
 * Fetch orders for the logged-in user with their items
 */
export async function fetchUserOrders(explicitUserId?: string): Promise<DbOrder[]> {
  const localOrders = getLocalOrders();
  try {
    const userId = await getEffectiveUserId(explicitUserId);

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return localOrders;
    }

    // Merge Supabase orders with any local orders
    const dbOrders = data as DbOrder[];
    const dbOrderNumbers = new Set(dbOrders.map((o) => o.order_number));
    const extraLocals = localOrders.filter((l) => !dbOrderNumbers.has(l.order_number));
    const deletedIds = getDeletedOrderIds();

    return [...dbOrders, ...extraLocals].filter(
      (o) => !deletedIds.includes(o.id) && !deletedIds.includes(o.order_number)
    );
  } catch (err) {
    console.warn("fetchUserOrders error, returning local:", err);
    return localOrders;
  }
}

/**
 * Fetch all orders across platform (Admin only)
 */
export async function fetchAllOrders(): Promise<DbOrder[]> {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all orders:", error.message);
      return getLocalOrders();
    }

    const deletedIds = getDeletedOrderIds();
    const activeOrders = (orders || []).filter(
      (o) => !deletedIds.includes(o.id) && !deletedIds.includes(o.order_number)
    );

    if (activeOrders.length > 0) {
      const userIds = Array.from(new Set(activeOrders.map((o) => o.user_id).filter(Boolean)));
      let profileMap = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, role, shop_name, full_name, phone")
          .in("id", userIds);

        profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      }

      return activeOrders.map((o) => {
        const prof = profileMap.get(o.user_id);
        const shipAddr = (o.shipping_address || {}) as any;

        // Role resolution:
        // 1. From database profile record
        // 2. From order user_role or shipping_address user_role metadata
        // 3. Fallback inference from shop name
        let resolvedRole: "retailer" | "customer" = "customer";
        if (prof?.role === "retailer" || o.user_role === "retailer" || shipAddr?.user_role === "retailer") {
          resolvedRole = "retailer";
        } else if (prof?.role === "customer" || o.user_role === "customer" || shipAddr?.user_role === "customer") {
          resolvedRole = "customer";
        } else if (
          prof?.shop_name ||
          o.shop_name ||
          shipAddr?.shop_name ||
          o.customer_name?.toLowerCase().includes("store") ||
          o.customer_name?.toLowerCase().includes("pharmacy") ||
          o.customer_name?.toLowerCase().includes("medical")
        ) {
          resolvedRole = "retailer";
        }

        const resolvedShopName =
          prof?.shop_name ||
          o.shop_name ||
          shipAddr?.shop_name ||
          (resolvedRole === "retailer" ? o.customer_name : null);

        return {
          ...o,
          user_role: resolvedRole,
          shop_name: resolvedShopName,
        };
      }) as DbOrder[];
    }

    return getLocalOrders();
  } catch (e) {
    console.error("Error in fetchAllOrders:", e);
    return getLocalOrders();
  }
}

/**
 * Update order status (Admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ error: string | null }> {
  if (status === "Cancelled") {
    try {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity")
        .eq("order_id", orderId);

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          if (item.product_id) {
            const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
            if (prod) {
              await supabase.from("products").update({ stock: prod.stock + item.quantity }).eq("id", item.product_id);
            }
          } else if (item.product_name) {
            const { data: prod } = await supabase.from("products").select("id, stock").eq("name", item.product_name).maybeSingle();
            if (prod) {
              await supabase.from("products").update({ stock: prod.stock + item.quantity }).eq("id", prod.id);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Stock restoration warning:", e);
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Delete order by ID or order number (Admin only)
 * Completely deletes the order and its child items from Supabase database
 */
export async function deleteOrder(orderId: string): Promise<{ error: string | null }> {
  try {
    const trimmed = orderId.trim();
    markOrderAsDeletedLocally(trimmed);

    // 1. Locate all matching order records from database
    let targetUuids: string[] = [];
    try {
      const { data: matched } = await supabase
        .from("orders")
        .select("id, order_number")
        .or(`id.eq.${trimmed},order_number.eq.${trimmed}`);

      if (matched && matched.length > 0) {
        targetUuids = matched.map((m) => m.id);
        for (const m of matched) {
          markOrderAsDeletedLocally(m.id, m.order_number);
        }
      }
    } catch (findErr) {
      console.warn("Could not query matching orders before deletion:", findErr);
    }

    if (targetUuids.length === 0) {
      targetUuids = [trimmed];
    }

    // 2. Cascade delete from order_items table first (avoids foreign key constraint violation)
    for (const uuid of targetUuids) {
      try {
        await supabase.from("order_items").delete().eq("order_id", uuid);
      } catch (itemDelErr) {
        console.warn("order_items delete note:", itemDelErr);
      }
    }

    // 3. Delete from orders table
    let dbError: string | null = null;
    for (const uuid of targetUuids) {
      const { error } = await supabase.from("orders").delete().eq("id", uuid);
      if (error) {
        console.warn("Database order delete by ID warning:", error);
        dbError = error.message;
      }
    }

    // Also attempt delete by order_number
    try {
      await supabase.from("orders").delete().eq("order_number", trimmed);
    } catch {
      // ignore
    }

    // 4. Clean up local storage cache
    try {
      const locals = getLocalOrders();
      const updated = locals.filter(
        (o) => o.id !== trimmed && o.order_number !== trimmed && !targetUuids.includes(o.id)
      );
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return { error: dbError };
  } catch (e: any) {
    console.error("Error deleting order:", e);
    return { error: e.message || "Failed to delete order" };
  }
}

/**
 * Fetch a single order by order number or ID
 */
export async function fetchOrderByNumber(orderNumberOrId: string): Promise<DbOrder | null> {
  try {
    const trimmed = orderNumberOrId.trim();
    let query = supabase
      .from("orders")
      .select("*, order_items(*)");

    if (trimmed.startsWith("ORD-")) {
      query = query.eq("order_number", trimmed);
    } else if (trimmed.includes("-")) {
      query = query.eq("id", trimmed);
    } else {
      query = query.or(`order_number.eq.${trimmed},order_number.eq.ORD-${trimmed}`);
    }

    const { data, error } = await query.maybeSingle();
    if (data && !error) return data as DbOrder;

    // Check local storage fallback
    const locals = getLocalOrders();
    const match = locals.find(
      (o) =>
        o.order_number.toLowerCase() === trimmed.toLowerCase() ||
        o.id.toLowerCase() === trimmed.toLowerCase() ||
        o.order_number.toLowerCase() === `ord-${trimmed.toLowerCase()}`
    );
    return match || null;
  } catch (e) {
    console.error("Error fetching order by number:", e);
    return null;
  }
}

/**
 * Subscribe to realtime updates for a specific user's orders
 */
export function subscribeToUserOrdersRealtime(userId: string, onUpdate: () => void) {
  const channel = supabase
    .channel(`user-orders-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to realtime updates for all orders
 */
export function subscribeToOrdersRealtime(onUpdate: (payload: any) => void) {
  const channel = supabase
    .channel("public-orders-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
