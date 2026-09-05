import { neon } from "@neondatabase/serverless";

// Use the exact same connection string as the app (from neon.ts)
const PROD_DB_URL =
  "postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(PROD_DB_URL);

async function run() {
  try {
    console.log("Checking sub_categories table schema...");
    const cols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sub_categories'
      ORDER BY ordinal_position;
    `;
    console.log(
      "Existing columns:",
      cols.map((c: any) => c.column_name)
    );

    console.log("Adding missing 'slug' column if not exists...");
    await sql`
      ALTER TABLE sub_categories
      ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '';
    `;

    console.log("Adding missing 'status' column if not exists...");
    await sql`
      ALTER TABLE sub_categories
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    `;

    console.log("Adding missing 'created_at' column if not exists...");
    await sql`
      ALTER TABLE sub_categories
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    `;

    console.log("Adding missing 'updated_at' column if not exists...");
    await sql`
      ALTER TABLE sub_categories
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    `;

    const colsAfter = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'sub_categories'
      ORDER BY ordinal_position;
    `;
    console.log(
      "Columns after fix:",
      colsAfter.map((c: any) => c.column_name)
    );

    console.log("Fix successful!");
  } catch (error) {
    console.error("Fix failed:", error);
    process.exit(1);
  }
}

run();
