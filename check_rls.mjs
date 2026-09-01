import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const rls = await sql`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('store_settings', 'products');`;
    console.log('RLS Status:', rls);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
