import { Pool, PoolClient } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for order processing');
}

const pool = new Pool({ connectionString });

export type OrderRole = 'customer' | 'retailer' | 'admin';

export interface OrderPayload {
  idempotencyKey: string;
  cartItems: any[];
  customer: { id: string; name: string; phone: string };
  paymentType?: string;
  paymentRef?: string | null;
  totalAmount: number;
  shippingAddress?: Record<string, any>;
  userRole?: OrderRole;
  shopName?: string | null;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function money(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function normalisePaymentMethod(value: unknown): string {
  const v = String(value || 'COD').trim();
  return v === 'online' ? 'UPI' : v;
}

function deliveryCharge(role: OrderRole, subtotal: number): number {
  return role === 'retailer' || subtotal >= 150 ? 0 : 40;
}

async function getExistingOrder(client: PoolClient, idempotencyKey: string) {
  const { rows } = await client.query(
    `SELECT id, order_number FROM orders WHERE idempotency_key = $1 LIMIT 1`,
    [idempotencyKey]
  );
  return rows[0] || null;
}

export async function createOrder(payload: OrderPayload) {
  if (!payload.idempotencyKey || !Array.isArray(payload.cartItems) || payload.cartItems.length === 0) {
    throw new Error('Cart is empty or order request is incomplete');
  }
  if (!payload.customer?.id || !isUuid(payload.customer.id)) {
    throw new Error('A valid signed-in user is required to place an order');
  }

  const role: OrderRole = payload.userRole === 'retailer' ? 'retailer' : 'customer';
  const paymentMethod = normalisePaymentMethod(payload.paymentType);
  const paymentStatus = paymentMethod === 'UPI' || paymentMethod === 'Card' || payload.paymentType === 'online' ? 'Paid' : 'Pending';
  const shippingAddress = payload.shippingAddress && typeof payload.shippingAddress === 'object' ? payload.shippingAddress : {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // The unique constraint on idempotency_key is the final protection against
    // double-clicks, retries and concurrent requests. We also check inside the
    // same transaction so a retry returns the original order.
    const existing = await getExistingOrder(client, payload.idempotencyKey);
    if (existing) {
      await client.query('COMMIT');
      return { id: existing.id, order_number: existing.order_number, existing: true };
    }

    const resolvedItems: any[] = [];
    for (const raw of payload.cartItems) {
      const quantity = Math.max(1, Math.floor(Number(raw.quantity || 0)));
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid item quantity');

      const productId = typeof raw.productId === 'string' && isUuid(raw.productId) ? raw.productId : null;
      const numericId = Number(raw.productNumericId ?? raw.numeric_id ?? 0);

      let product: any = null;
      if (productId) {
        const result = await client.query(
          `SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price, stock, image_url
           FROM products WHERE id = $1 FOR UPDATE`,
          [productId]
        );
        product = result.rows[0] || null;
      }
      if (!product && Number.isInteger(numericId) && numericId > 0) {
        const result = await client.query(
          `SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price, stock, image_url
           FROM products WHERE numeric_id = $1 FOR UPDATE`,
          [numericId]
        );
        product = result.rows[0] || null;
      }
      // Legacy carts may not contain a DB id. Name is only a last-resort lookup;
      // exact database product data still wins over anything sent by the browser.
      if (!product && typeof raw.name === 'string' && raw.name.trim()) {
        const result = await client.query(
          `SELECT id, numeric_id, name, sku, mrp, customer_price, retailer_price, stock, image_url
           FROM products WHERE lower(name) = lower($1) ORDER BY id LIMIT 1 FOR UPDATE`,
          [raw.name.trim()]
        );
        product = result.rows[0] || null;
      }
      if (!product) throw new Error(`Product not found: ${raw.name || raw.productId || raw.productNumericId}`);
      if (Number(product.stock) < quantity) throw new Error(`${product.name} does not have enough stock`);

      const unitPrice = money(role === 'retailer' ? product.retailer_price : product.customer_price);
      const lineTotal = money(unitPrice * quantity);
      resolvedItems.push({ product, quantity, unitPrice, lineTotal, raw });
    }

    const subtotal = money(resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const delivery = deliveryCharge(role, subtotal);
    const serverTotal = money(subtotal + delivery);
    const clientTotal = money(payload.totalAmount);

    // Never trust a browser-calculated price. Allow only a one-cent rounding
    // difference; otherwise the order is rejected instead of being silently
    // stored with mismatched invoice data.
    if (Math.abs(serverTotal - clientTotal) > 0.01) {
      throw new Error(`Order total changed. Expected ₹${serverTotal.toFixed(2)} but received ₹${clientTotal.toFixed(2)}. Please refresh your cart.`);
    }

    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_phone, shipping_address,
        total_amount, payment_method, payment_status, status, user_role, shop_name, idempotency_key
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Processing',$9,$10,$11)
      RETURNING id, order_number, user_id, customer_name, customer_phone, shipping_address,
                total_amount, payment_method, payment_status, status, user_role, shop_name, created_at, updated_at`,
      [
        orderNumber,
        payload.customer.id,
        payload.customer.name || 'Customer',
        payload.customer.phone || '',
        JSON.stringify({ ...shippingAddress, user_role: role, shop_name: payload.shopName || null }),
        serverTotal,
        paymentMethod,
        paymentStatus,
        role,
        payload.shopName || null,
        payload.idempotencyKey,
      ]
    );

    const order = orderRows[0];
    const items: any[] = [];
    for (const item of resolvedItems) {
      const { product, quantity, unitPrice, lineTotal } = item;
        const batchNo = `SBH-${String(product.numeric_id || '101').padStart(3, '0')}-${new Date().toISOString().slice(2, 7).replace('-', '')}`;
        const expiryDate = `12/${(new Date().getFullYear() + 2).toString().slice(-2)}`;
        const { rows } = await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, sku, variant, quantity, unit_price, total_price, image_url, mrp, batch_no, expiry_date
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING id, order_id, product_id, product_name, sku, variant, quantity, unit_price, total_price, image_url, mrp, batch_no, expiry_date`,
          [order.id, product.id, product.name, product.sku || null, rawVariant(item) || null, quantity, unitPrice, lineTotal, product.image_url || null, product.mrp ? Number(product.mrp) : unitPrice, batchNo, expiryDate]
        );
        items.push(rows[0]);

      await client.query(
        `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
        [quantity, product.id]
      );
    }

    await client.query('COMMIT');
    return { ...order, total_amount: Number(order.total_amount), order_items: items, existing: false };
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch {}
    // A concurrent request may have inserted the same idempotency key between
    // our initial check and INSERT. Return that canonical order rather than
    // creating a second order.
    if (error?.code === '23505' && String(error?.constraint || '').includes('idempotency')) {
      const existing = await getExistingOrder(client, payload.idempotencyKey);
      if (existing) return { id: existing.id, order_number: existing.order_number, existing: true };
    }
    throw error;
  } finally {
    client.release();
  }
}

function rawVariant(item: any): string | null {
  return item?.raw?.variant || item?.variant || null;
}
