import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" });

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { idempotencyKey, cartItems, customer, paymentType, paymentRef, totalAmount, shippingAddress, userRole, shopName } = req.body;

        if (!idempotencyKey || !cartItems || !customer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const client = await pool.connect();

        try {
            // 1. Check idempotency first — prevents duplicate/lost orders on retry
            const { rows: existing } = await client.query(`SELECT id, order_number FROM orders WHERE idempotency_key = $1`, [idempotencyKey]);
            if (existing.length > 0) {
                client.release();
                return res.status(200).json({ id: existing[0].id, order_number: existing[0].order_number });
            }

            const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
            const paymentStatus = paymentType === 'online' ? 'Paid' : 'Pending';

            await client.query('BEGIN');

            const { rows: orderRes } = await client.query(`
                INSERT INTO orders (
                    order_number, user_id, customer_name, customer_phone, shipping_address, 
                    total_amount, payment_method, payment_status, status, user_role, shop_name, idempotency_key
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Processing', $9, $10, $11) 
                RETURNING id
            `, [
                orderNumber, customer.id, customer.name, customer.phone, JSON.stringify(shippingAddress || {}),
                totalAmount, paymentType, paymentStatus, userRole || 'customer', shopName || null, idempotencyKey
            ]);
            
            const orderId = orderRes[0].id;

            for (const item of cartItems) {
                await client.query(`
                    INSERT INTO order_items (
                        order_id, product_id, product_name, sku, variant, quantity, unit_price, total_price, image_url
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    orderId, item.productId || item.id, item.name, item.sku || null, item.variant || null, 
                    item.quantity, item.price, item.price * item.quantity, item.imageUrl || null
                ]);

                // Decrement stock
                const targetId = item.productId || item.id;
                if (targetId) {
                    if (targetId.includes('-')) {
                        // UUID format, presumably id
                        await client.query(`UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2`, [item.quantity, targetId]);
                    } else {
                        // string format, presumably name
                        await client.query(`UPDATE products SET stock = GREATEST(0, stock - $1) WHERE name = $2`, [item.quantity, item.name]);
                    }
                }
            }

            await client.query('COMMIT');
            client.release();
            return res.status(200).json({ id: orderId, order_number: orderNumber });
        } catch (err) {
            await client.query('ROLLBACK');
            client.release();
            throw err;
        }
    } catch (error: any) {
        console.error('Order creation error:', error);
        return res.status(500).json({ error: error?.message || 'Order creation failed' });
    }
}
