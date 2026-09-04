import { Pool } from '@neondatabase/serverless';

function getPool() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.VITE_NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    console.warn('DATABASE_URL is not configured for /api/delivery-location');
    return null;
  }
  return new Pool({ connectionString });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not configured.' });
  }

  let client: any = null;
  try {
    client = await pool.connect();

    // GET /api/delivery-location?orderId=... OR ?all=true
    if (req.method === 'GET') {
      const { orderId, all } = req.query || {};

      if (all === 'true') {
        const query = `
          SELECT 
            l.user_id, l.order_id, l.lat, l.lng, l.accuracy_m, l.updated_at,
            u.name as partner_name, p.phone as partner_phone, p.avatar_url, p.vehicle_type, p.vehicle_number
          FROM public.delivery_locations l
          JOIN public.users u ON u.id = l.user_id
          JOIN public.delivery_partner_profiles p ON p.user_id = l.user_id
          WHERE p.is_on_duty = true AND u.deleted_at IS NULL
          ORDER BY l.updated_at DESC
        `;
        const result = await client.query(query);
        return res.status(200).json({ locations: result.rows });
      }

      if (orderId) {
        // Scoped to order
        const query = `
          SELECT 
            l.user_id, l.order_id, l.lat, l.lng, l.accuracy_m, l.updated_at,
            u.name as partner_name, p.phone as partner_phone, p.avatar_url, p.vehicle_type, p.vehicle_number
          FROM public.orders o
          JOIN public.delivery_locations l ON l.user_id = o.delivery_partner_id
          JOIN public.users u ON u.id = o.delivery_partner_id
          LEFT JOIN public.delivery_partner_profiles p ON p.user_id = o.delivery_partner_id
          WHERE (o.id = $1 OR o.order_number = $1)
            AND o.delivery_partner_id IS NOT NULL
            AND o.delivery_status IN ('accepted', 'picked_up')
          LIMIT 1
        `;
        const result = await client.query(query, [orderId]);
        return res.status(200).json({ location: result.rows[0] || null });
      }

      return res.status(400).json({ error: 'Missing orderId or all parameter' });
    }

    // POST /api/delivery-location (Upsert location from partner)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { partnerId, lat, lng, accuracy, orderId } = body;

      if (!partnerId || lat == null || lng == null) {
        return res.status(400).json({ error: 'Missing partnerId, lat, or lng' });
      }

      const query = `
        INSERT INTO public.delivery_locations (user_id, order_id, lat, lng, accuracy_m, updated_at)
        VALUES ($1::uuid, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          accuracy_m = EXCLUDED.accuracy_m,
          order_id = COALESCE(EXCLUDED.order_id, delivery_locations.order_id),
          updated_at = NOW()
        RETURNING *
      `;
      const result = await client.query(query, [partnerId, orderId || null, lat, lng, accuracy || null]);

      return res.status(200).json({ success: true, location: result.rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error in /api/delivery-location:', err);
    return res.status(500).json({ error: err.message || 'Server error processing delivery location' });
  } finally {
    if (client) client.release();
  }
}
