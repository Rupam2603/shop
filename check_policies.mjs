import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const policies = await sql`SELECT polname, pg_get_expr(polqual, polrelid) as USING, pg_get_expr(polwithcheck, polrelid) as WITH_CHECK FROM pg_policy WHERE polrelid = 'store_settings'::regclass;`;
    console.log('Policies on store_settings:', policies);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
