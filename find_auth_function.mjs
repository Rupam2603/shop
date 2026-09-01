import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const funcs = await sql`SELECT proname, nspname FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE proname ILIKE '%jwt%' OR proname ILIKE '%role%' OR proname ILIKE '%admin%';`;
    console.log('Auth-related functions:', funcs);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
