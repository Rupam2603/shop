import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const funcs = await sql`SELECT proname, prosrc FROM pg_proc WHERE proname ILIKE '%admin%';`;
    console.log('Admin functions:', funcs);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
