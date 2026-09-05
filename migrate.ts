import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
async function run() {
  try {
    console.log("Creating sub_categories table...");
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
    
    console.log("Altering products table...");
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS sub_category_id TEXT,
      ADD COLUMN IF NOT EXISTS sub_category_name TEXT;
    `;
    
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
run();
