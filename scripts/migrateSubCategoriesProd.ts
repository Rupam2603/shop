import { neon } from "@neondatabase/serverless";

// Use the exact same connection string as the app (from neon.ts)
const PROD_DB_URL = "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(PROD_DB_URL);

async function run() {
  try {
    console.log("Creating sub_categories table on production DB...");
    await sql`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;

    console.log("Adding sub_category columns to products table...");
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS sub_category_id TEXT,
      ADD COLUMN IF NOT EXISTS sub_category_name TEXT;
    `;

    console.log("Verifying table exists...");
    const rows = await sql`SELECT COUNT(*) FROM sub_categories`;
    console.log("sub_categories table row count:", rows[0].count);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
