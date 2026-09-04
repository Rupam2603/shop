import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function runDeliveryPartnerMigration() {
  console.log("Starting Delivery Partner Database Migration on Neon PostgreSQL...");

  // 1. Alter user_role enum to add 'delivery_partner' if not already present
  try {
    console.log("1. Checking user_role enum...");
    await sql.query(`ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'delivery_partner';`);
    console.log("   ✓ Added 'delivery_partner' to user_role enum");
  } catch (err) {
    console.log("   Notice on user_role enum:", err.message);
  }

  // 2. Create public.delivery_partner_profiles table
  try {
    console.log("2. Creating public.delivery_partner_profiles table...");
    await sql.query(`
      CREATE TABLE IF NOT EXISTS public.delivery_partner_profiles (
        user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        phone TEXT,
        address TEXT,
        avatar_url TEXT,
        vehicle_type TEXT,
        vehicle_number TEXT,
        profile_completed BOOLEAN NOT NULL DEFAULT false,
        is_on_duty BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("   ✓ Created public.delivery_partner_profiles");
  } catch (err) {
    console.error("   Error creating delivery_partner_profiles:", err);
  }

  // 3. Create public.delivery_locations table
  try {
    console.log("3. Creating public.delivery_locations table...");
    await sql.query(`
      CREATE TABLE IF NOT EXISTS public.delivery_locations (
        user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        order_id TEXT,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        accuracy_m DOUBLE PRECISION,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_delivery_locations_order ON public.delivery_locations(order_id);
    `);
    console.log("   ✓ Created public.delivery_locations");
  } catch (err) {
    console.error("   Error creating delivery_locations:", err);
  }

  // 4. Create public.delivery_attendance table
  try {
    console.log("4. Creating public.delivery_attendance table...");
    await sql.query(`
      CREATE TABLE IF NOT EXISTS public.delivery_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        work_date DATE NOT NULL,
        check_in_at TIMESTAMPTZ,
        check_out_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'absent',
        UNIQUE(user_id, work_date)
      );
    `);
    console.log("   ✓ Created public.delivery_attendance");
  } catch (err) {
    console.error("   Error creating delivery_attendance:", err);
  }

  // 5. Extend public.orders with delivery columns
  try {
    console.log("5. Adding delivery columns to public.orders table...");
    await sql.query(`
      ALTER TABLE public.orders
        ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS delivery_accepted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'unassigned';
    `);
    console.log("   ✓ Extended public.orders with delivery columns");
  } catch (err) {
    console.error("   Error extending public.orders:", err);
  }

  console.log("Migration complete!");
}

runDeliveryPartnerMigration().catch(console.error);
