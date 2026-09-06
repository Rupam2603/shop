import { sql } from "./neon";
import type { DbOrder } from "./orders";
import { notifyOrderEvent } from "./orderEvents";

function isUuidString(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str).trim());
}

/**
 * Fetch available orders waiting to be accepted by delivery partners.
 * Filter: delivery_status is 'unassigned' or NULL, and base status is deliverable.
 */
export async function fetchAvailableOrdersForPartners(): Promise<DbOrder[]> {
  try {
    const rows = await sql`
      SELECT 
        o.id,
        o.order_number,
        o.user_id,
        o.customer_name,
        o.customer_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status,
        o.created_at,
        o.updated_at,
        o.user_role,
        o.shop_name,
        o.delivery_partner_id,
        o.delivery_accepted_at,
        COALESCE(o.delivery_status, 'unassigned') as delivery_status
      FROM public.orders o
      WHERE (o.delivery_status = 'unassigned' OR o.delivery_status IS NULL)
        AND o.status NOT IN ('Delivered', 'Cancelled')
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

    if (rows.length === 0) return [];

    const orderIds = rows.map((r: any) => r.id);
    const itemRows = await sql`
      SELECT id, order_id, product_id, product_name, sku, variant, quantity, unit_price, total_price, image_url, mrp, batch_no, expiry_date
      FROM public.order_items
      WHERE order_id = ANY(${orderIds}::text[])
    `;

    const itemsMap = new Map<string, any[]>();
    for (const it of itemRows) {
      const list = itemsMap.get(it.order_id) || [];
      list.push(it);
      itemsMap.set(it.order_id, list);
    }

    return rows.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount || 0),
      order_items: itemsMap.get(o.id) || [],
    }));
  } catch (err) {
    console.error("Error fetching available orders for partners:", err);
    return [];
  }
}

/**
 * Accept an order for delivery.
 * CRITICAL: Atomic conditional UPDATE WHERE delivery_status = 'unassigned' to prevent race conditions.
 */
export async function acceptOrderForDelivery(
  orderId: string,
  partnerId: string,
  partnerName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const partnerUuid = isUuidString(partnerId) ? partnerId : null;
    const res = await sql`
      UPDATE public.orders
      SET 
        delivery_partner_id = ${partnerUuid}::uuid,
        delivery_status = 'accepted',
        delivery_accepted_at = NOW(),
        status = CASE WHEN status = 'Processing' THEN 'Dispatched' ELSE status END,
        updated_at = NOW()
      WHERE (id = ${orderId} OR order_number = ${orderId})
        AND (delivery_status = 'unassigned' OR delivery_status IS NULL)
      RETURNING id, order_number
    `;

    if (!res || res.length === 0) {
      return {
        success: false,
        error: "This order was just accepted by another delivery partner or is no longer available.",
      };
    }

    notifyOrderEvent("assigned", { orderId, partnerId });
    return { success: true };
  } catch (err: any) {
    console.error("Error accepting order for delivery:", err);
    return { success: false, error: err.message || "Failed to accept order." };
  }
}

/**
 * Fetch orders assigned to a specific delivery partner (active or completed)
 */
export async function fetchOrdersForPartner(
  partnerId: string,
  opts?: { activeOnly?: boolean; completedOnly?: boolean }
): Promise<DbOrder[]> {
  try {
    const cleanId = String(partnerId || "").trim();
    if (!cleanId) return [];

    let rows;
    if (opts?.activeOnly) {
      rows = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.user_id,
          o.customer_name,
          o.customer_phone,
          o.shipping_address,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.status,
          o.created_at,
          o.updated_at,
          o.user_role,
          o.shop_name,
          o.delivery_partner_id,
          o.delivery_accepted_at,
          o.delivery_status,
          u.name as delivery_partner_name
        FROM public.orders o
        LEFT JOIN public.users u ON u.id = o.delivery_partner_id
        WHERE o.delivery_partner_id::text = ${cleanId}
          AND o.delivery_status IN ('accepted', 'picked_up')
        ORDER BY o.delivery_accepted_at DESC NULLS LAST
      `;
    } else if (opts?.completedOnly) {
      rows = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.user_id,
          o.customer_name,
          o.customer_phone,
          o.shipping_address,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.status,
          o.created_at,
          o.updated_at,
          o.user_role,
          o.shop_name,
          o.delivery_partner_id,
          o.delivery_accepted_at,
          o.delivery_status,
          u.name as delivery_partner_name
        FROM public.orders o
        LEFT JOIN public.users u ON u.id = o.delivery_partner_id
        WHERE o.delivery_partner_id::text = ${cleanId}
          AND (o.delivery_status = 'delivered' OR o.status = 'Delivered')
        ORDER BY o.updated_at DESC
        LIMIT 50
      `;
    } else {
      rows = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.user_id,
          o.customer_name,
          o.customer_phone,
          o.shipping_address,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.status,
          o.created_at,
          o.updated_at,
          o.user_role,
          o.shop_name,
          o.delivery_partner_id,
          o.delivery_accepted_at,
          o.delivery_status,
          u.name as delivery_partner_name
        FROM public.orders o
        LEFT JOIN public.users u ON u.id = o.delivery_partner_id
        WHERE o.delivery_partner_id::text = ${cleanId}
        ORDER BY o.created_at DESC
        LIMIT 60
      `;
    }

    if (!rows || rows.length === 0) return [];

    const orderIds = rows.map((r: any) => r.id);
    const itemRows = await sql`
      SELECT id, order_id, product_id, product_name, sku, variant, quantity, unit_price, total_price, image_url, mrp, batch_no, expiry_date
      FROM public.order_items
      WHERE order_id = ANY(${orderIds}::text[])
    `;

    const itemsMap = new Map<string, any[]>();
    for (const it of itemRows) {
      const list = itemsMap.get(it.order_id) || [];
      list.push(it);
      itemsMap.set(it.order_id, list);
    }

    return rows.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount || 0),
      order_items: itemsMap.get(o.id) || [],
    }));
  } catch (err) {
    console.error("Error fetching orders for delivery partner:", err);
    return [];
  }
}

/**
 * Mark order as picked up
 */
export async function markOrderPickedUp(
  orderId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await sql`
      UPDATE public.orders
      SET 
        delivery_status = 'picked_up',
        status = 'Out for Delivery',
        updated_at = NOW()
      WHERE (id = ${orderId} OR order_number = ${orderId})
        AND delivery_partner_id::text = ${partnerId}
      RETURNING id
    `;

    if (!res || res.length === 0) {
      return { success: false, error: "Order not found or not assigned to you." };
    }

    notifyOrderEvent("picked_up", { orderId, partnerId, status: "Out for Delivery" });
    return { success: true };
  } catch (err: any) {
    console.error("Error marking order as picked up:", err);
    return { success: false, error: err.message || "Failed to mark as picked up." };
  }
}

/**
 * Mark order as delivered
 */
export async function markOrderDelivered(
  orderId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await sql`
      UPDATE public.orders
      SET 
        delivery_status = 'delivered',
        status = 'Delivered',
        payment_status = 'Paid',
        updated_at = NOW()
      WHERE (id = ${orderId} OR order_number = ${orderId})
        AND delivery_partner_id::text = ${partnerId}
      RETURNING id
    `;

    if (!res || res.length === 0) {
      return { success: false, error: "Order not found or not assigned to you." };
    }

    // Clear active order link from delivery_locations
    await sql`
      UPDATE public.delivery_locations
      SET order_id = NULL, updated_at = NOW()
      WHERE user_id::text = ${partnerId} AND order_id = ${orderId}
    `.catch(() => {});

    notifyOrderEvent("delivered", { orderId, partnerId, status: "Delivered" });
    return { success: true };
  } catch (err: any) {
    console.error("Error marking order as delivered:", err);
    return { success: false, error: err.message || "Failed to mark as delivered." };
  }
}

/**
 * Fetch delivered orders for a partner within a date range for reporting.
 *
 * @param partnerId   UUID of the delivery partner
 * @param monthYYYYMM Month string "YYYY-MM" (used when startDate/endDate not provided)
 * @param startDate   Optional ISO date string for range start
 * @param endDate     Optional ISO date string for range end (exclusive)
 */
export async function fetchDeliveryPartnerOrdersByMonth(
  partnerId: string,
  monthYYYYMM: string,
  startDate?: string,
  endDate?: string
): Promise<DbOrder[]> {
  try {
    let rangeStart: string;
    let rangeEnd: string;

    if (startDate && endDate) {
      rangeStart = new Date(startDate).toISOString();
      rangeEnd = new Date(endDate).toISOString();
    } else {
      // Parse "YYYY-MM" safely — tolerate numeric args passed by mistake
      const mmStr = String(monthYYYYMM);
      const parts = mmStr.includes("-") ? mmStr.split("-") : [];
      if (parts.length !== 2) {
        console.error("fetchDeliveryPartnerOrdersByMonth: invalid monthYYYYMM:", monthYYYYMM);
        return [];
      }
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      rangeStart = new Date(year, month - 1, 1).toISOString();
      rangeEnd   = new Date(year, month, 1).toISOString();      // exclusive: start of next month
    }

    // Use COALESCE(delivered_at, updated_at) so that:
    //   • If a dedicated delivered_at column exists, it is used (accurate).
    //   • Otherwise falls back to updated_at (legacy rows).
    // This prevents orders from disappearing when an admin edits them later.
    const rows = await sql`
      SELECT 
        o.id,
        o.order_number,
        o.user_id,
        o.customer_name,
        o.customer_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status,
        o.created_at,
        o.updated_at,
        o.user_role,
        o.shop_name,
        o.delivery_partner_id,
        o.delivery_accepted_at,
        o.delivery_status,
        u.name as delivery_partner_name
      FROM public.orders o
      LEFT JOIN public.users u ON u.id = o.delivery_partner_id
      WHERE o.delivery_partner_id = ${partnerId}::uuid
        AND (o.delivery_status = 'delivered' OR o.status = 'Delivered')
        AND COALESCE(o.updated_at, o.created_at) >= ${rangeStart}
        AND COALESCE(o.updated_at, o.created_at) <  ${rangeEnd}
      ORDER BY COALESCE(o.updated_at, o.created_at) ASC
    `;

    if (!rows || rows.length === 0) return [];

    // ── Reconciliation check ────────────────────────────────────────────────
    // Count ALL delivered orders in this period for this partner and warn if
    // the query somehow missed any.
    try {
      const countRows = await sql`
        SELECT COUNT(*) AS cnt
        FROM public.orders
        WHERE delivery_partner_id = ${partnerId}::uuid
          AND (delivery_status = 'delivered' OR status = 'Delivered')
          AND COALESCE(updated_at, created_at) >= ${rangeStart}
          AND COALESCE(updated_at, created_at) <  ${rangeEnd}
      `;
      const dbCount = Number(countRows[0]?.cnt ?? 0);
      if (dbCount !== rows.length) {
        console.warn(
          `[RECONCILIATION] Delivery record mismatch for partner ${partnerId}: ` +
          `DB count = ${dbCount}, export rows = ${rows.length}. ` +
          `Some orders may be missing from the export.`
        );
      }
    } catch (recErr) {
      console.warn("[RECONCILIATION] Could not run count check:", recErr);
    }
    // ────────────────────────────────────────────────────────────────────────

    const orderIds = rows.map((r: any) => r.id);
    const itemRows = await sql`
      SELECT
        id, order_id, product_id, product_name, sku, variant,
        quantity, unit_price, total_price, image_url,
        mrp, purchase_price_at_order, batch_no, expiry_date
      FROM public.order_items
      WHERE order_id = ANY(${orderIds}::text[])
    `;

    const itemsMap = new Map<string, any[]>();
    for (const it of itemRows) {
      const list = itemsMap.get(it.order_id) || [];
      list.push(it);
      itemsMap.set(it.order_id, list);
    }

    return rows.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount || 0),
      order_items: itemsMap.get(o.id) || [],
    }));
  } catch (err) {
    console.error("Error fetching partner monthly orders:", err);
    return [];
  }
}
