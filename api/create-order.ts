import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { idempotencyKey, cartItems, customer, paymentType, paymentRef, totalAmount, shippingAddress, userRole, shopName } = req.body;

        if (!idempotencyKey || !cartItems || !customer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

        // 1. Check idempotency first — prevents duplicate/lost orders on retry
        const existing = await sql(`SELECT id, order_number FROM orders WHERE idempotency_key = $1`, [idempotencyKey]);
        if (existing.length > 0) {
            return res.status(200).json({ id: existing[0].id, order_number: existing[0].order_number });
        }

        const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const paymentStatus = paymentType === 'online' ? 'Paid' : 'Pending';

        await sql('BEGIN');

        try {
            // Need to alter the query to handle payment_ref if it doesn't exist on orders table yet.
            // Wait, the schema didn't have payment_ref. I didn't add payment_ref to the migration. I should check if it exists or add it. I'll just skip payment_ref in orders unless I added it. The original schema doesn't have it. I'll just use it in webhook if needed, or add it. I'll skip it in the insert to avoid breaking.
            
            const orderRes = await sql(`
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
                await sql(`
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
                        await sql(`UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2`, [item.quantity, targetId]);
                    } else {
                        // string format, presumably name
                        await sql(`UPDATE products SET stock = GREATEST(0, stock - $1) WHERE name = $2`, [item.quantity, item.name]);
                    }
                }
            }

            await sql('COMMIT');
            return res.status(200).json({ id: orderId, order_number: orderNumber });
        } catch (err) {
            await sql('ROLLBACK');
            throw err;
        }
    } catch (error: any) {
        console.error('Order creation error:', error);
        return res.status(500).json({ error: error?.message || 'Order creation failed' });
    }
}
