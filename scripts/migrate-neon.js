import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function runMigration() {
  console.log("Connecting to Neon Postgres and setting up schema...");

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      full_name TEXT NOT NULL DEFAULT 'User',
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      shop_name TEXT,
      avatar_url TEXT,
      approval_status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.retailer_approvals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id TEXT,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      shop_name TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      hsn_code TEXT NOT NULL DEFAULT '3004',
      accent_color TEXT NOT NULL DEFAULT '#006a39',
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.products (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      numeric_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      subtitle TEXT,
      category_id TEXT,
      category_name TEXT NOT NULL,
      brand TEXT NOT NULL,
      sku TEXT,
      hsn TEXT NOT NULL DEFAULT '3004',
      mrp NUMERIC NOT NULL DEFAULT 0,
      customer_price NUMERIC NOT NULL DEFAULT 0,
      retailer_price NUMERIC NOT NULL DEFAULT 0,
      discount_percent NUMERIC NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 50,
      image_url TEXT NOT NULL,
      details TEXT,
      is_flash_sale BOOLEAN NOT NULL DEFAULT FALSE,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      badges JSONB DEFAULT '[]'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

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
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.phone_verifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      full_name TEXT,
      shop_name TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      order_number TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address JSONB NOT NULL DEFAULT '{}'::JSONB,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      status TEXT NOT NULL DEFAULT 'Processing',
      user_role TEXT DEFAULT 'customer',
      shop_name TEXT,
      idempotency_key TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.order_items (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      product_id TEXT,
      product_name TEXT NOT NULL,
      sku TEXT,
      variant TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price NUMERIC NOT NULL DEFAULT 0,
      total_price NUMERIC NOT NULL DEFAULT 0,
      image_url TEXT
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.lab_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      badge TEXT,
      tests_count INTEGER NOT NULL DEFAULT 0,
      tests_summary TEXT NOT NULL,
      included_tests JSONB NOT NULL DEFAULT '[]'::JSONB,
      features JSONB NOT NULL DEFAULT '[]'::JSONB,
      mrp NUMERIC NOT NULL DEFAULT 0,
      price NUMERIC NOT NULL DEFAULT 0,
      discount_percent NUMERIC NOT NULL DEFAULT 0,
      fasting_required BOOLEAN NOT NULL DEFAULT FALSE,
      fasting_hours INTEGER NOT NULL DEFAULT 0,
      sample_type TEXT NOT NULL DEFAULT 'Blood Sample',
      report_turnaround TEXT NOT NULL DEFAULT '24 Hours',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.lab_test_bookings (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      booking_number TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      package_id TEXT,
      package_name TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      patient_age INTEGER NOT NULL,
      patient_gender TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      collection_address JSONB NOT NULL DEFAULT '{}'::JSONB,
      collection_date TEXT NOT NULL,
      collection_time_slot TEXT NOT NULL,
      fasting_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      status TEXT NOT NULL DEFAULT 'Scheduled',
      report_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.reviews (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      product_id TEXT,
      product_numeric_id INTEGER,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL DEFAULT 'customer',
      rating INTEGER NOT NULL DEFAULT 5,
      title TEXT,
      comment TEXT NOT NULL,
      verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
      helpful_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.store_settings (
      id TEXT PRIMARY KEY DEFAULT 'default_settings',
      store_name TEXT NOT NULL DEFAULT 'SubhOne Health Group',
      phone TEXT DEFAULT '+91 98765 43210',
      email TEXT DEFAULT 'support@subhone.com',
      address TEXT DEFAULT '14/B Central Avenue, Kolkata, West Bengal 700012',
      low_threshold TEXT DEFAULT '10',
      default_disc TEXT DEFAULT '15',
      email_alerts BOOLEAN DEFAULT TRUE,
      sms_alerts BOOLEAN DEFAULT FALSE,
      auto_reorder BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.auth_users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      shop_name TEXT,
      approval_status TEXT NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS public.failed_webhooks (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      payload JSONB NOT NULL,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Alter tables to add new columns if they exist but are missing these columns
  await sql.query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;`);
  await sql.query(`ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS sku TEXT;`);
  await sql.query(`ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant TEXT;`);


  // Insert initial default settings
  await sql.query(`
    INSERT INTO public.store_settings (id, store_name, phone, email, address, low_threshold, default_disc, email_alerts, sms_alerts, auto_reorder)
    VALUES ('default_settings', 'SubhOne Health Group', '+91 98765 43210', 'support@subhone.com', '14/B Central Avenue, Kolkata, West Bengal 700012', '10', '15', true, false, true)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert default Admin profile
  await sql.query(`
    INSERT INTO public.profiles (id, email, full_name, role, approval_status)
    VALUES ('admin_fixed_id', 'admin@subhone.com', 'Store Administrator', 'admin', 'approved')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert default Admin auth user (password: admin123)
  await sql.query(`
    INSERT INTO public.auth_users (id, email, password_hash, full_name, role, approval_status)
    VALUES ('admin_fixed_id', 'admin@subhone.com', 'admin123', 'Store Administrator', 'admin', 'approved')
    ON CONFLICT (email) DO NOTHING;
  `);

  console.log("Migration finished successfully!");
}

runMigration().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
