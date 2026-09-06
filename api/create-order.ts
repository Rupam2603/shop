import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('DATABASE_URL is not configured. Order API requests will fail safely.');
}

const pool = new Pool({ connectionString });

function isPositiveInt(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function makeOrderNumber() {
  return `ORD-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!connectionString) return res.status(500).json({ error: 'Order service is not configured.' });

  const body = req.body || {};
  const {
    idempotencyKey,
    cartItems,
    customer,
    paymentType,
    totalAmount: clientTotal,
    shippingAddress,
    userRole,
    shopName,
  } = body;

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return res.status(400).json({ error: 'Missing idempotency key.' });
  }
  if (!customer?.id || !customer?.name || !customer?.phone) {
    return res.status(400).json({ error: 'Customer information is incomplete.' });
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Your shopping cart is empty.' });
  }

  const client = await pool.connect();
  try {
    // Idempotency is checked inside the same transaction as creation.
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      `SELECT id, order_number, user_id, customer_name, customer_phone,
              shipping_address, total_amount, payment_method, payment_status,
              status, user_role, shop_name, invoice_number, created_at, updated_at
         FROM orders
        WHERE idempotency_key = $1
        FOR UPDATE`,
      [idempotencyKey]
    );

    if (existing.length) {
      const existingOrder = existing[0];
      const { rows: existingItems } = await client.query(
        `SELECT id, order_id, product_id, product_name, sku, variant,
                quantity, unit_price, total_price, image_url, mrp, batch_no, expiry_date
           FROM order_items
          WHERE order_id = $1
          ORDER BY id`,
        [existingOrder.id]
      );
      await client.query('COMMIT');
      return res.status(200).json({ ...existingOrder, order_items: existingItems });
    }

    const role = userRole === 'retailer' ? 'retailer' : 'customer';
    // Retailers are strictly restricted to Cash on Delivery (COD); online and card payments are disabled.
    const paymentMethod = role === 'retailer' ? 'COD' : (typeof paymentType === 'string' && paymentType ? paymentType : 'COD');
    const paymentStatus = paymentMethod === 'online' || paymentMethod === 'UPI' || paymentMethod === 'Card' ? 'Paid' : 'Pending';

    // Resolve every cart line against the current product row. Never trust the
    // browser's product name or price as the source of truth.
    const resolvedItems: any[] = [];
    let subtotal = 0;

    for (const raw of cartItems) {
      const quantity = Number(raw?.quantity);
      if (!isPositiveInt(quantity)) {
        throw new Error(`Invalid quantity for ${raw?.name || 'product'}.`);
      }

      const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const rawProductId = typeof raw?.productId === 'string' && raw.productId.trim() ? raw.productId.trim() : null;
      const validProductId = rawProductId && isUuid(rawProductId) ? rawProductId : null;

      const numericId = Number(raw?.productNumericId);
      const hasNumericId = Number.isInteger(numericId) && numericId > 0;
      const productName = typeof raw?.name === 'string' ? raw.name.trim() : null;

      if (!validProductId && !hasNumericId && !productName) {
        throw new Error(`Product identity is missing for ${raw?.name || 'an item'}.`);
      }

      let lookup = validProductId
        ? await client.query(
            `SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price,
                    stock, image_url, purchase_price
               FROM products
              WHERE id = $1
              FOR UPDATE`,
            [validProductId]
          )
        : { rows: [] as any[] };

      if (!lookup.rows.length && hasNumericId) {
        lookup = await client.query(
            `SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price,
                    stock, image_url, purchase_price
               FROM products
              WHERE numeric_id = $1
              FOR UPDATE`,
            [numericId]
          );
      }

      if (!lookup.rows.length && productName) {
        lookup = await client.query(
            `SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price,
                    stock, image_url, purchase_price
               FROM products
              WHERE name = $1
              FOR UPDATE`,
            [productName]
          );
      }

      if (!lookup.rows.length) {
        throw new Error(`Product not found: ${productName || rawProductId || numericId}.`);
      }

      const product = lookup.rows[0];
      const stock = toNumber(product.stock);
      if (stock < quantity) {
        throw new Error(`${product.name} has only ${stock} unit${stock === 1 ? '' : 's'} available.`);
      }

      const unitPrice = role === 'retailer'
        ? toNumber(product.retailer_price)
        : toNumber(product.customer_price);
      if (unitPrice < 0) throw new Error(`Invalid price for ${product.name}.`);

      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      resolvedItems.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || null,
        variant: raw?.variant || null,
        quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
        image_url: product.image_url || null,
        mrp: toNumber(product.mrp, unitPrice),
        purchase_price_at_order: product.purchase_price ? Number(product.purchase_price) : null,
        batch_no: raw?.batchNo || raw?.batch_no || `SBH-${String(product.numeric_id || '101').padStart(3, '0')}-${new Date().toISOString().slice(2, 7).replace('-', '')}`,
        expiry_date: raw?.expiryDate || raw?.expiry_date || `12/${(new Date().getFullYear() + 2).toString().slice(-2)}`,
        stock_before: stock,
      });
    }

    // Checkout currently charges only item subtotal plus the delivery fee.
    // Recalculate that amount server-side so the database and invoice cannot
    // disagree with the cart UI.
    const deliveryFee = role === 'retailer' || subtotal >= 150 ? 0 : 40;
    const authoritativeTotal = subtotal + deliveryFee;
    const suppliedTotal = toNumber(clientTotal, authoritativeTotal);
    if (Math.abs(suppliedTotal - authoritativeTotal) > 0.01) {
      throw new Error('Cart total changed. Please review your cart and try again.');
    }

    const orderNumber = makeOrderNumber();

    // Defensively ensure invoice_number column exists across any branch/database instance
    await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT');

    // Lock table to ensure every different order gets a different, strictly sequential invoice number
    await client.query('LOCK TABLE orders IN SHARE ROW EXCLUSIVE MODE');

    // Determine sequential invoice number starting from INV-001
    const { rows: seqRows } = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(COALESCE(invoice_number, ''), '[^0-9]', '', 'g'), '')::int), 0) + 1 AS next_seq FROM orders`
    );
    const nextSeq = Number(seqRows[0]?.next_seq || 1);
    const invoiceNumber = `INV-${String(nextSeq).padStart(3, '0')}`;

    const address = {
      ...(shippingAddress || {}),
      user_role: role,
      shop_name: shopName || null,
    };

    const { rows: orderRes } = await client.query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_phone, shipping_address,
        total_amount, payment_method, payment_status, status, user_role, shop_name,
        idempotency_key, invoice_number
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Processing',$9,$10,$11,$12)
      RETURNING id, order_number, user_id, customer_name, customer_phone,
                shipping_address, total_amount, payment_method, payment_status,
                status, user_role, shop_name, invoice_number, created_at, updated_at`,
      [
        orderNumber,
        String(customer.id),
        String(customer.name).trim(),
        String(customer.phone).trim(),
        JSON.stringify(address),
        authoritativeTotal,
        paymentMethod,
        paymentStatus,
        role,
        shopName || null,
        idempotencyKey,
        invoiceNumber,
      ]
    );

    const order = orderRes[0];
    const itemRows: any[] = [];

    for (const item of resolvedItems) {
      const { rows } = await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, sku, variant, quantity,
          unit_price, total_price, image_url, mrp, purchase_price_at_order, batch_no, expiry_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING id, order_id, product_id, product_name, sku, variant,
                  quantity, unit_price, total_price, image_url, mrp, purchase_price_at_order, batch_no, expiry_date`,
        [
          order.id, item.product_id, item.product_name, item.sku, item.variant,
          item.quantity, item.unit_price, item.total_price, item.image_url,
          item.mrp, item.purchase_price_at_order, item.batch_no, item.expiry_date,
        ]
      );
      itemRows.push(rows[0]);

      const stockUpdate = await client.query(
        `UPDATE products
            SET stock = stock - $1, updated_at = NOW()
          WHERE id = $2 AND stock >= $1`,
        [item.quantity, item.product_id]
      );
      if (stockUpdate.rowCount !== 1) {
        throw new Error(`Stock changed while placing ${item.product_name}. Please try again.`);
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({ ...order, order_items: itemRows });
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Order creation error:', error);
    return res.status(500).json({ error: error?.message || 'Order creation failed. Nothing was charged or saved.' });
  } finally {
    client.release();
  }
}
