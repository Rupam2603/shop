import { supabase } from "./supabase";
import { DbAddress } from "./addresses";
import { CartItem } from "../contexts/CartContext";

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
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItem[];
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

/**
 * Place a new order with order items
 */
export async function placeOrder(params: {
  customerName: string;
  customerPhone: string;
  shippingAddress: Partial<DbAddress>;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
}): Promise<{ data: DbOrder | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (!params.items || params.items.length === 0) {
    return { data: null, error: "Cart is empty" };
  }

  const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Create order record
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        order_number: orderNumber,
        user_id: user.id,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        shipping_address: params.shippingAddress,
        total_amount: params.totalAmount,
        payment_method: params.paymentMethod,
        payment_status: "Paid",
        status: "Processing",
      },
    ])
    .select()
    .single();

  if (orderError) {
    return { data: null, error: orderError.message };
  }

  const orderId = orderData.id;

  // 2. Insert order items
  const orderItemsPayload = params.items.map((item) => ({
    order_id: orderId,
    product_id: item.productId && item.productId.includes("-") ? item.productId : null,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
    image_url: item.imageUrl,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) {
    console.error("Error creating order items:", itemsError.message);
  }

  // 3. Clear user's cart in Supabase
  await supabase.from("cart_items").delete().eq("user_id", user.id);

  return { data: orderData as DbOrder, error: null };
}

/**
 * Fetch orders for the logged-in user with their items
 */
export async function fetchUserOrders(): Promise<DbOrder[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user orders:", error.message);
    return [];
  }
  return data as DbOrder[];
}

/**
 * Fetch all orders across platform (Admin only)
 */
export async function fetchAllOrders(): Promise<DbOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all orders:", error.message);
    return [];
  }
  return data as DbOrder[];
}

/**
 * Update order status (Admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled"
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
