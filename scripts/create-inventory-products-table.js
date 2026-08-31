import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function createInventoryProductsTable() {
  console.log("Creating inventory_products table in Neon Postgres...");

  // 1. Create table `inventory_products`
  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.inventory_products (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      numeric_id INTEGER,
      product_id TEXT,
      name TEXT NOT NULL,
      subtitle TEXT,
      category_id TEXT,
      category_name TEXT NOT NULL DEFAULT 'General Medicine',
      brand TEXT NOT NULL DEFAULT 'SubhOne Pharma',
      sku TEXT,
      batch_no TEXT,
      hsn TEXT NOT NULL DEFAULT '3004',
      mrp NUMERIC NOT NULL DEFAULT 0,
      customer_price NUMERIC NOT NULL DEFAULT 0,
      retailer_price NUMERIC NOT NULL DEFAULT 0,
      purchase_price NUMERIC NOT NULL DEFAULT 0,
      discount_percent NUMERIC NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 50,
      min_stock_level INTEGER NOT NULL DEFAULT 10,
      unit TEXT NOT NULL DEFAULT 'Strip',
      dosage_form TEXT DEFAULT 'Tablet',
      strength TEXT,
      expiry_date TEXT,
      image_url TEXT NOT NULL DEFAULT '',
      web_image_url TEXT,
      gallery_images JSONB DEFAULT '[]'::JSONB,
      details TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_flash_sale BOOLEAN NOT NULL DEFAULT FALSE,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      badges JSONB DEFAULT '[]'::JSONB,
      meta_data JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log("Table public.inventory_products created or verified successfully.");

  // 2. Create indexes for high performance querying
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_inv_products_name ON public.inventory_products (name)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_inv_products_category ON public.inventory_products (category_name)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_inv_products_brand ON public.inventory_products (brand)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_inv_products_sku ON public.inventory_products (sku)`);

  // 3. Populate / sync from public.products if exists
  const existingProducts = await sql.query(`SELECT * FROM public.products ORDER BY numeric_id ASC`);
  console.log(`Found ${existingProducts.length} existing products in public.products. Syncing to inventory_products...`);

  for (const p of existingProducts) {
    await sql.query(`
      INSERT INTO public.inventory_products (
        id, numeric_id, product_id, name, subtitle, category_id, category_name,
        brand, sku, hsn, mrp, customer_price, retailer_price, discount_percent,
        stock, image_url, web_image_url, details, is_flash_sale, is_featured, badges, updated_at
      )
      VALUES (
        $1, $2, $1, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $15, $16, $17, $18, $19, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        subtitle = EXCLUDED.subtitle,
        category_name = EXCLUDED.category_name,
        brand = EXCLUDED.brand,
        sku = EXCLUDED.sku,
        mrp = EXCLUDED.mrp,
        customer_price = EXCLUDED.customer_price,
        retailer_price = EXCLUDED.retailer_price,
        discount_percent = EXCLUDED.discount_percent,
        stock = EXCLUDED.stock,
        image_url = EXCLUDED.image_url,
        web_image_url = EXCLUDED.web_image_url,
        details = EXCLUDED.details,
        is_flash_sale = EXCLUDED.is_flash_sale,
        is_featured = EXCLUDED.is_featured,
        updated_at = NOW()
    `, [
      p.id,
      p.numeric_id,
      p.name,
      p.subtitle || null,
      p.category_id || null,
      p.category_name,
      p.brand,
      p.sku || null,
      p.hsn || '3004',
      p.mrp,
      p.customer_price,
      p.retailer_price,
      p.discount_percent,
      p.stock,
      p.image_url,
      p.details || null,
      p.is_flash_sale || false,
      p.is_featured || false,
      JSON.stringify(p.badges || [])
    ]);
  }

  // 4. Verify table row count
  const countRes = await sql.query(`SELECT COUNT(*) as total FROM public.inventory_products`);
  console.log(`Inventory products table verified with ${countRes[0].total} records.`);

  const sample = await sql.query(`SELECT id, name, category_name, brand, stock, customer_price, image_url, web_image_url FROM public.inventory_products LIMIT 3`);
  console.log("Sample records from public.inventory_products:", sample);
}

createInventoryProductsTable().catch((err) => {
  console.error("Error creating inventory_products table:", err);
  process.exit(1);
});
