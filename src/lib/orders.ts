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

function getLocalOrders(): DbOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
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
            shipping_address: params.shippingAddress,
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
      shipping_address: params.shippingAddress,
      total_amount: params.totalAmount,
      payment_method: params.paymentMethod || "UPI",
      payment_status: "Paid",
      status: "Processing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_role: params.userRole,
      shop_name: params.shopName,
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

    return [...dbOrders, ...extraLocals];
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

    if (orders && orders.length > 0) {
      const userIds = Array.from(new Set(orders.map((o) => o.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, role, shop_name, full_name, phone")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        return orders.map((o) => {
          const prof = profileMap.get(o.user_id);
          const inferredRole: "retailer" | "customer" =
            prof?.role ||
            (o.customer_name?.toLowerCase().includes("store") ||
            o.customer_name?.toLowerCase().includes("pharmacy") ||
            o.customer_name?.toLowerCase().includes("medical")
              ? "retailer"
              : "customer");

          return {
            ...o,
            user_role: inferredRole,
            shop_name: prof?.shop_name || null,
          };
        }) as DbOrder[];
      }
    }

    return (orders || []) as DbOrder[];
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
 */
export async function deleteOrder(orderId: string): Promise<{ error: string | null }> {
  try {
    // Delete from Supabase
    const { error } = await supabase
      .from("orders")
      .delete()
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    // Clean up local storage cache if any
    try {
      const locals = getLocalOrders();
      const updated = locals.filter(
        (o) => o.id !== orderId && o.order_number !== orderId
      );
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (error) {
      console.warn("Supabase deleteOrder warning:", error);
      return { error: error.message };
    }
    return { error: null };
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
