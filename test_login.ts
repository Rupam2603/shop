import 'dotenv/config';
import { createNeonUser, authenticateNeonUser } from './src/lib/users.ts';
import { neon } from '@neondatabase/serverless';

async function test() {
  const email = 'test_customer_' + Date.now() + '@example.com';
  const pass = 'password123';
  console.log('1. Signing up', email);
  const signupResult = await createNeonUser({ email, password: pass, fullName: 'Test', role: 'customer' });
  console.log('Signup result:', signupResult.success);

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT password_hash, status FROM public.users WHERE email = ${email}`;
  console.log('2. DB row:', rows[0]);

  console.log('3. Logging in manually');
  const loginResult = await authenticateNeonUser(email, pass);
  console.log('Login result:', loginResult);
}
test().catch(console.error);
