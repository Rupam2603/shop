import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();

const connectionString =
  process.env.VITE_NEON_DATABASE_URL ||
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function runWeeklyOffMigration() {
  console.log("Adding weekly_off_day column to public.delivery_partner_profiles...");

  try {
    await sql`
      ALTER TABLE public.delivery_partner_profiles
      ADD COLUMN IF NOT EXISTS weekly_off_day TEXT;
    `;
    console.log("✓ Added weekly_off_day column to public.delivery_partner_profiles");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

runWeeklyOffMigration().catch(console.error);
