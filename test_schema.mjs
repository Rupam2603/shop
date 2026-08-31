import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
async function test() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`;
  console.log(rows);
}
test().catch(console.error);
