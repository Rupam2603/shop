import { neon } from "@neondatabase/serverless";

const connectionString =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function createPhoneAuthTable() {
  console.log("Creating phone_verifications table in Neon Postgres...");

  // 1. Create table `phone_verifications`
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
    )
  `);

  console.log("Table public.phone_verifications created successfully.");

  // 2. Create indexes
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications (phone)`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON public.phone_verifications (expires_at)`);

  console.log("Phone verifications table setup completed and verified.");
}

createPhoneAuthTable().catch((err) => {
  console.error("Error setting up phone auth table:", err);
  process.exit(1);
});
