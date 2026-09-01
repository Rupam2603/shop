import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function makeOrderNumber() {
  return `ORD-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!connectionString) return res.status(500).json({ error: 'Payment order service is not configured.' });

  const body = req.body || {};
  const {
    payment_id,
    cartItems,
    customer,
    paymentType,
    totalAmount: clientTotal,
    shippingAddress,
    userRole,
    shopName,
  } = body;

  if (!payment_id || !customer?.id || !customer?.name || !customer?.phone || !Array.isArray(cartItems) || !cartItems.length) {
    return res.status(400).json({ error: 'Payment webhook is missing the complete order payload.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      `SELECT id, order_number, user_id, customer_name, customer_phone,
              shipping_address, total_amount, payment_method, payment_status,
              status, user_role, shop_name, created_at, updated_at
         FROM orders
        WHERE idempotency_key = $1
        FOR UPDATE`,
      [String(payment_id)]
    );

    if (existing.length) {
      const order = existing[0];
      const { rows: items } = await client.query(
        `SELECT id, order_id, product_id, product_name, sku, variant, quantity,
                unit_price, total_price, image_url, mrp, batch_no, expiry_date
           FROM order_items WHERE order_id = $1 ORDER BY id`,
        [order.id]
      );
      await client.query('COMMIT');
      return res.status(200).json({ ...order, order_items: items });
    }

    const role = userRole === 'retailer' ? 'retailer' : 'customer';
    const resolvedItems: any[] = [];
    let subtotal = 0;

    for (const raw of cartItems) {
      const quantity = Number(raw?.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Invalid quantity for ${raw?.name || 'product'}.`);

      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const rawProductId = typeof raw?.productId === 'string' && raw.productId.trim() ? raw.productId.trim() : null;
      const validProductId = rawProductId && isUuid(rawProductId) ? rawProductId : null;

      const numericId = Number(raw?.productNumericId);
      const hasNumericId = Number.isInteger(numericId) && numericId > 0;
      const productName = typeof raw?.name === 'string' ? raw.name.trim() : null;
      
      let lookup = validProductId
        ? await client.query(`SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price, stock, image_url FROM products WHERE id = $1 FOR UPDATE`, [validProductId])
        : { rows: [] as any[] };
        
      if (!lookup.rows.length && hasNumericId) {
        lookup = await client.query(`SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price, stock, image_url FROM products WHERE numeric_id = $1 FOR UPDATE`, [numericId]);
      }

      if (!lookup.rows.length && productName) {
        lookup = await client.query(`SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price, stock, image_url FROM products WHERE name = $1 FOR UPDATE`, [productName]);
      }

      if (!lookup.rows.length) throw new Error(`Product not found: ${productName || rawProductId || numericId}.`);
      const product = lookup.rows[0];
      const stock = toNumber(product.stock);
      if (stock < quantity) throw new Error(`${product.name} has only ${stock} unit${stock === 1 ? '' : 's'} available.`);

      const unitPrice = role === 'retailer' ? toNumber(product.retailer_price) : toNumber(product.customer_price);
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;
      resolvedItems.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || null,
        variant: raw?.variant || null,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        image_url: product.image_url || null,
        mrp: toNumber(product.mrp, unitPrice),
        batch_no: raw?.batchNo || raw?.batch_no || null,
        expiry_date: raw?.expiryDate || raw?.expiry_date || null,
      });
    }

    const deliveryFee = role === 'retailer' || subtotal >= 150 ? 0 : 40;
    const total = subtotal + deliveryFee;
    if (Math.abs(toNumber(clientTotal, total) - total) > 0.01) throw new Error('Payment amount does not match the current cart total.');

    const orderNumber = makeOrderNumber();
    const address = { ...(shippingAddress || {}), user_role: role, shop_name: shopName || null };
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
        order_number,user_id,customer_name,customer_phone,shipping_address,
        total_amount,payment_method,payment_status,status,user_role,shop_name,idempotency_key
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'Paid','Processing',$8,$9,$10)
      RETURNING id,order_number,user_id,customer_name,customer_phone,shipping_address,
                total_amount,payment_method,payment_status,status,user_role,shop_name,created_at,updated_at`,
      [orderNumber, String(customer.id), String(customer.name).trim(), String(customer.phone).trim(), JSON.stringify(address), total, paymentType || 'online', role, shopName || null, String(payment_id)]
    );
    const order = orderRows[0];
    const items: any[] = [];

    for (const item of resolvedItems) {
      const { rows } = await client.query(
        `INSERT INTO order_items (
          order_id,product_id,product_name,sku,variant,quantity,unit_price,total_price,image_url,mrp,batch_no,expiry_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id,order_id,product_id,product_name,sku,variant,quantity,unit_price,total_price,image_url,mrp,batch_no,expiry_date`,
        [order.id,item.product_id,item.product_name,item.sku,item.variant,item.quantity,item.unit_price,item.total_price,item.image_url,item.mrp,item.batch_no,item.expiry_date]
      );
      items.push(rows[0]);
      const stockUpdate = await client.query(`UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1`, [item.quantity, item.product_id]);
      if (stockUpdate.rowCount !== 1) throw new Error(`Stock changed while placing ${item.product_name}.`);
    }

    await client.query('COMMIT');
    return res.status(200).json({ ...order, order_items: items });
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Payment webhook order creation error:', error);
    return res.status(500).json({ error: error?.message || 'Payment order creation failed.' });
  } finally {
    client.release();
  }
}
