import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const res = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public';`;
    console.log('Tables:', res);
  } catch (error) {
    console.error("Error:", error);
  }
}

run().catch(console.error);
