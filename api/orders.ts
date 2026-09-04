import { Pool } from '@neondatabase/serverless';

function getPool() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.VITE_NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    console.warn('DATABASE_URL is not configured for /api/orders');
    return null;
  }
  return new Pool({ connectionString });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
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

    // GET /api/orders?userId=...
    if (req.method === 'GET') {
      const { userId, orderNumber, orderId } = req.query || {};

      let query = `
        SELECT 
          o.*,
          dp.name AS delivery_partner_name,
          dpp.phone AS delivery_partner_phone
        FROM orders o
        LEFT JOIN users dp ON dp.id = o.delivery_partner_id
        LEFT JOIN delivery_partner_profiles dpp ON dpp.user_id = o.delivery_partner_id
      `;
      const params: any[] = [];

      if (orderId) {
        query += ' WHERE o.id = $1';
        params.push(orderId);
      } else if (orderNumber) {
        query += ' WHERE o.order_number = $1';
        params.push(orderNumber);
      } else if (userId) {
        query += ' WHERE o.user_id = $1';
        params.push(userId);
      }

      query += ' ORDER BY o.created_at DESC';

      const ordersRes = await client.query(query, params);
      const orders = ordersRes.rows || [];

      if (orders.length === 0) {
        return res.status(200).json({ orders: [] });
      }

      const orderIds = orders.map((o: any) => o.id);
      const itemsRes = await client.query(
        'SELECT * FROM order_items WHERE order_id = ANY($1::text[]) ORDER BY id ASC',
        [orderIds]
      );

      const itemsByOrderId = new Map<string, any[]>();
      for (const item of itemsRes.rows || []) {
        const list = itemsByOrderId.get(item.order_id) || [];
        list.push(item);
        itemsByOrderId.set(item.order_id, list);
      }

      const fullOrders = orders.map((o: any) => ({
        ...o,
        order_items: itemsByOrderId.get(o.id) || [],
      }));

      return res.status(200).json({ orders: fullOrders });
    }

    // PATCH /api/orders (Update status)
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { orderId, status } = body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Missing orderId or status' });
      }

      // If cancelling, restore stock
      if (status === 'Cancelled') {
        const items = await client.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [orderId]
        );
        for (const it of items.rows || []) {
          if (it.product_id) {
            await client.query(
              'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2',
              [it.quantity, it.product_id]
            );
          }
        }
      }

      const updateRes = await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 OR order_number = $2 RETURNING *',
        [status, orderId]
      );

      return res.status(200).json({ success: true, order: updateRes.rows[0] });
    }

    // DELETE /api/orders (Delete single order)
    if (req.method === 'DELETE') {
      const { orderId } = req.query || req.body || {};
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
      await client.query('DELETE FROM orders WHERE id = $1 OR order_number = $1', [orderId]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error in /api/orders handler:', err);
    return res.status(500).json({ error: err.message || 'Server error processing orders' });
  } finally {
    if (client) {
      client.release();
    }
  }
}
