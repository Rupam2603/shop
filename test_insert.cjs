require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function run() {
  const cleanEmail = 'test_customer_' + Date.now() + '@example.com';
  console.log('Inserting...', cleanEmail);
  const userId = 'user_test123_' + Date.now();
  try {
    const insertResult = await sql.query(
      `INSERT INTO public.users (id, name, email, password_hash, role, status, business_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, token_version`,
      [userId, 'Test Cust', cleanEmail, 'dummy_hash', 'customer', 'active', '']
    );
    console.log('Result:', insertResult);
  } catch (err) {
    console.error('Insert error:', err);
  }
  process.exit(0);
}
run();
