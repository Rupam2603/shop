import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" });

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ACK the webhook fast, always — gateways disable webhooks that time out
    res.status(200).send('ok');

    const client = await pool.connect();

    try {
        const { payment_id, cartItems, customer, paymentType, totalAmount, shippingAddress, userRole, shopName } = req.body;
        
        // This simulates picking up a pending cart using webhook metadata
        // In a real flow, cartItems would be fetched securely from a pending_carts table

        const idempotencyKey = payment_id;

        // Call the same logic for order creation
        // 1. Check idempotency first — prevents duplicate/lost orders on retry
        const { rows: existing } = await client.query(`SELECT id, order_number FROM orders WHERE idempotency_key = $1`, [idempotencyKey]);
        if (existing.length > 0) {
            client.release();
            return;
        }

        const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

        await client.query('BEGIN');

        try {
            const { rows: orderRes } = await client.query(`
                INSERT INTO orders (
                    order_number, user_id, customer_name, customer_phone, shipping_address, 
                    total_amount, payment_method, payment_status, status, user_role, shop_name, idempotency_key
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'Paid', 'Processing', $8, $9, $10) 
                RETURNING id
            `, [
                orderNumber, customer.id, customer.name, customer.phone, JSON.stringify(shippingAddress || {}),
                totalAmount, paymentType || 'online', userRole || 'customer', shopName || null, idempotencyKey
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
        } catch (err) {
            await client.query('ROLLBACK');
            client.release();
            throw err;
        }
    } catch (err: any) {
        // CRITICAL: log to a dead-letter table
        try {
            await client.query(
                `INSERT INTO failed_webhooks (payload, error, created_at) VALUES ($1,$2,now())`,
                [JSON.stringify(req.body), err.message]
            );
        } catch (logErr) {
            console.error('Failed to log webhook error:', logErr);
        }
        client.release();
    }
}
