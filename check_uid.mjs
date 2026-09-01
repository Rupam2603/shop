import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const res = await sql`SELECT proname, nspname FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE proname = 'uid' AND nspname = 'auth';`;
    console.log('auth.uid():', res);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
