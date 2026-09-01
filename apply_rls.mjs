import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log("Applying RLS policies to 'products' table...");
  
  try {
    await sql`ALTER TABLE products ENABLE ROW LEVEL SECURITY;`;
    console.log("Enabled RLS.");
    
    // Drop existing policies if any to avoid errors
    try { await sql`DROP POLICY IF EXISTS "products_select" ON products;`; } catch(e){}
    try { await sql`DROP POLICY IF EXISTS "products_insert_admin" ON products;`; } catch(e){}
    try { await sql`DROP POLICY IF EXISTS "products_update_admin" ON products;`; } catch(e){}
    try { await sql`DROP POLICY IF EXISTS "products_delete_admin" ON products;`; } catch(e){}

    await sql`CREATE POLICY "products_select" ON products FOR SELECT TO anonymous, authenticated USING (true);`;
    await sql`CREATE POLICY "products_insert_admin" ON products FOR INSERT TO authenticated WITH CHECK (is_admin());`;
    await sql`CREATE POLICY "products_update_admin" ON products FOR UPDATE TO authenticated USING (is_admin());`;
    await sql`CREATE POLICY "products_delete_admin" ON products FOR DELETE TO authenticated USING (is_admin());`;
    console.log("Created policies.");

    await sql`GRANT SELECT ON products TO anonymous, authenticated;`;
    await sql`GRANT INSERT, UPDATE, DELETE ON products TO authenticated;`;
    console.log("Granted privileges.");

  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
