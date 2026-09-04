import { sql } from "./neon";

export interface DeliveryLocationPing {
  userId: string;
  orderId?: string | null;
  lat: number;
  lng: number;
  accuracyM?: number | null;
  updatedAt: string;
  partnerName?: string;
  partnerPhone?: string;
  avatarUrl?: string;
  vehicleType?: string;
  vehicleNumber?: string;
}

/**
 * Push delivery partner's current GPS position to Neon database.
 * Upserts on user_id.
 */
export async function pushDeliveryLocation(
  partnerId: string,
  loc: {
    lat: number;
    lng: number;
    accuracy?: number;
    orderId?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // We can also call /api/delivery-location if running in environment where direct client is preferred
    await sql`
      INSERT INTO public.delivery_locations (user_id, order_id, lat, lng, accuracy_m, updated_at)
      VALUES (${partnerId}::uuid, ${loc.orderId || null}, ${loc.lat}, ${loc.lng}, ${loc.accuracy || null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        accuracy_m = EXCLUDED.accuracy_m,
        order_id = COALESCE(EXCLUDED.order_id, delivery_locations.order_id),
        updated_at = NOW()
    `;

    return { success: true };
  } catch (err: any) {
    console.error("Error pushing delivery location:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all on-duty partner locations for Admin fleet view
 */
export async function fetchAllOnDutyPartnerLocations(): Promise<DeliveryLocationPing[]> {
  try {
    const rows = await sql`
      SELECT 
        l.user_id,
        l.order_id,
        l.lat,
        l.lng,
        l.accuracy_m,
        l.updated_at,
        u.name as partner_name,
        p.phone as partner_phone,
        p.avatar_url,
        p.vehicle_type,
        p.vehicle_number
      FROM public.delivery_locations l
      JOIN public.users u ON u.id = l.user_id
      JOIN public.delivery_partner_profiles p ON p.user_id = l.user_id
      WHERE p.is_on_duty = true AND u.deleted_at IS NULL
      ORDER BY l.updated_at DESC
    `;

    return rows.map((r: any) => ({
      userId: r.user_id,
      orderId: r.order_id,
      lat: Number(r.lat),
      lng: Number(r.lng),
      accuracyM: r.accuracy_m ? Number(r.accuracy_m) : null,
      updatedAt: r.updated_at,
      partnerName: r.partner_name,
      partnerPhone: r.partner_phone,
      avatarUrl: r.avatar_url,
      vehicleType: r.vehicle_type,
      vehicleNumber: r.vehicle_number,
    }));
  } catch (err) {
    console.error("Error fetching on duty partner locations:", err);
    return [];
  }
}

/**
 * Fetch partner location for a specific order.
 * Scoped check: verifies that the order has an assigned delivery partner.
 */
export async function fetchOrderDeliveryLocation(
  orderId: string
): Promise<DeliveryLocationPing | null> {
  try {
    const rows = await sql`
      SELECT 
        l.user_id,
        l.order_id,
        l.lat,
        l.lng,
        l.accuracy_m,
        l.updated_at,
        u.name as partner_name,
        p.phone as partner_phone,
        p.avatar_url,
        p.vehicle_type,
        p.vehicle_number
      FROM public.orders o
      JOIN public.delivery_locations l ON l.user_id = o.delivery_partner_id
      JOIN public.users u ON u.id = o.delivery_partner_id
      LEFT JOIN public.delivery_partner_profiles p ON p.user_id = o.delivery_partner_id
      WHERE (o.id = ${orderId} OR o.order_number = ${orderId})
        AND o.delivery_partner_id IS NOT NULL
        AND o.delivery_status IN ('accepted', 'picked_up')
      LIMIT 1
    `;

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    return {
      userId: r.user_id,
      orderId: r.order_id || orderId,
      lat: Number(r.lat),
      lng: Number(r.lng),
      accuracyM: r.accuracy_m ? Number(r.accuracy_m) : null,
      updatedAt: r.updated_at,
      partnerName: r.partner_name,
      partnerPhone: r.partner_phone,
      avatarUrl: r.avatar_url,
      vehicleType: r.vehicle_type,
      vehicleNumber: r.vehicle_number,
    };
  } catch (err) {
    console.error("Error fetching order delivery location:", err);
    return null;
  }
}
