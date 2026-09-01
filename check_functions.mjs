import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const functions = await sql`SELECT routine_name FROM information_schema.routines WHERE routine_type='FUNCTION' AND routine_schema='public'`;
    console.log('Functions:', functions);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
